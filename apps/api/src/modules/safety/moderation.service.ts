import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_SERVICE, AiService } from '../ai/ai.service';

/**
 * Runs user-authored text through the AI moderator and files a Report when it
 * is flagged, so it lands in the existing admin moderation queue. Never blocks
 * or throws — moderation must not break the user's action.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @Inject(AI_SERVICE) private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  /** Fire-and-forget review; returns nothing so callers stay fast. */
  review(authorId: string, text: string, context: string): void {
    void this.reviewNow(authorId, text, context).catch((err) =>
      this.logger.warn(`Moderation failed: ${(err as Error).message}`),
    );
  }

  private async reviewNow(authorId: string, text: string, context: string) {
    if (!text || text.trim().length < 3) return;
    const verdict = await this.ai.moderateText(text);
    if (!verdict.flagged) return;

    // Reports need a reporter; use the platform's super-admin as the system actor.
    const system = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    });
    if (!system || system.id === authorId) return;

    await this.prisma.report.create({
      data: {
        reporterId: system.id,
        reportedId: authorId,
        category: 'INAPPROPRIATE_CONTENT',
        details: `[IA · ${context}] ${verdict.reason ?? 'Contenu signalé'} — extrait : "${text.slice(0, 200)}"`,
      },
    });
    this.logger.warn(`AI flagged ${context} by ${authorId}: ${verdict.reason}`);
  }
}
