import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { DiscoveryService } from './discovery.service';

@ApiTags('discovery')
@ApiBearerAuth()
@Controller('discovery')
export class DiscoveryController {
  constructor(private discovery: DiscoveryService) {}

  @Get('feed')
  @ApiQuery({ name: 'limit', required: false })
  feed(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    const parsed = Number(limit) || 20;
    return this.discovery.feed(user.id, Math.min(parsed, 50));
  }

  @Get('daily-picks')
  dailyPicks(@CurrentUser() user: AuthUser) {
    return this.discovery.dailyPicks(user.id);
  }
}
