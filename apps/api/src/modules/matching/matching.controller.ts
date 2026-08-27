import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MatchingService } from './matching.service';
import { SwipeDto } from './dto/swipe.dto';

@ApiTags('matching')
@ApiBearerAuth()
@Controller()
export class MatchingController {
  constructor(private matching: MatchingService) {}

  @Post('swipes')
  swipe(@CurrentUser() user: AuthUser, @Body() dto: SwipeDto) {
    return this.matching.swipe(user.id, user.plan, dto.targetId, dto.type);
  }

  @Get('matches')
  listMatches(@CurrentUser() user: AuthUser) {
    return this.matching.listMatches(user.id);
  }

  @Delete('matches/:id')
  unmatch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.matching.unmatch(user.id, id);
  }

  @Get('likes/received')
  whoLikedMe(@CurrentUser() user: AuthUser) {
    return this.matching.whoLikedMe(user.id, user.plan);
  }

  @Get('swipes/favorites')
  favorites(@CurrentUser() user: AuthUser) {
    return this.matching.favorites(user.id);
  }

  @Get('matching/counts')
  counts(@CurrentUser() user: AuthUser) {
    return this.matching.counts(user.id);
  }
}
