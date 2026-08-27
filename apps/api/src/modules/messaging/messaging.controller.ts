import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('conversations')
export class MessagingController {
  constructor(private messaging: MessagingService) {}

  @Get()
  listConversations(@CurrentUser() user: AuthUser) {
    return this.messaging.listConversations(user.id);
  }

  @Get(':id/messages')
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = Number(limit) || 30;
    return this.messaging.listMessages(user.id, id, cursor, Math.min(parsed, 100));
  }
}
