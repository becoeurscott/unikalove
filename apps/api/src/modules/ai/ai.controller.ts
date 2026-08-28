import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_SERVICE, AiService } from './ai.service';
import { OpenRouterAiService } from './openrouter-ai.service';
import { CoachDto, ReplySuggestionsDto } from './dto/ai.dto';

/** Shape passed to the model — never the raw DB row (no emails, no coordinates). */
function publicProfile(p: any) {
  return {
    prenom: p?.displayName,
    age: p?.birthDate
      ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / 31_557_600_000)
      : undefined,
    ville: p?.city,
    pays: p?.country,
    bio: p?.bio,
    intention: p?.intent,
    interets: p?.interests?.map((i: any) => i.interest?.slug ?? i.slug).filter(Boolean),
  };
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    @Inject(AI_SERVICE) private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  /** Enforce the per-user daily budget when the live provider is active. */
  private async assertBudget(userId: string) {
    if (this.ai instanceof OpenRouterAiService && !(await this.ai.withinBudget(userId))) {
      throw new ForbiddenException("Quota IA quotidien atteint — réessayez demain.");
    }
  }

  private profileOf(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      include: { interests: { include: { interest: true } } },
    });
  }

  @Get('profile-suggestions')
  async profileSuggestions(@CurrentUser() user: AuthUser) {
    const profile = await this.profileOf(user.id);
    if (!profile) throw new NotFoundException('Profil introuvable');
    await this.assertBudget(user.id);
    return { suggestions: await this.ai.profileSuggestions(publicProfile(profile)) };
  }

  @Get('starters/:conversationId')
  async starters(@CurrentUser() user: AuthUser, @Param('conversationId') id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { match: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    const { userAId, userBId } = conversation.match;
    if (userAId !== user.id && userBId !== user.id) {
      throw new ForbiddenException('Conversation non autorisée');
    }
    const otherId = userAId === user.id ? userBId : userAId;
    const [mine, theirs] = await Promise.all([
      this.profileOf(user.id),
      this.profileOf(otherId),
    ]);
    if (!mine || !theirs) throw new NotFoundException('Profil introuvable');
    await this.assertBudget(user.id);
    return {
      starters: await this.ai.conversationStarters(
        publicProfile(mine),
        publicProfile(theirs),
      ),
    };
  }

  @Post('reply-suggestions')
  async replySuggestions(@CurrentUser() user: AuthUser, @Body() dto: ReplySuggestionsDto) {
    await this.assertBudget(user.id);
    return { replies: await this.ai.replySuggestions(dto) };
  }

  /**
   * Premium only. The coach runs on the most expensive model and is 38% of all
   * AI spend — leaving it open to free accounts made low-conversion scenarios
   * unprofitable, since free users generate no revenue.
   */
  @Post('coach')
  async coach(@CurrentUser() user: AuthUser, @Body() dto: CoachDto) {
    if (user.plan === 'FREE') {
      throw new ForbiddenException(
        'Le Coach IA est réservé aux membres Premium — passez à Premium pour en profiter.',
      );
    }
    await this.assertBudget(user.id);
    return { answer: await this.ai.coach(dto.message, dto.history) };
  }
}
