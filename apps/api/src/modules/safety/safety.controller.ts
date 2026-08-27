import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { SafetyService } from './safety.service';
import { CreateReportDto } from './dto/safety.dto';

@ApiTags('safety')
@ApiBearerAuth()
@Controller()
export class SafetyController {
  constructor(private safety: SafetyService) {}

  @Post('reports')
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.safety.report(user.id, dto);
  }

  @Post('blocks/:userId')
  block(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.safety.block(user.id, userId);
  }

  @HttpCode(204)
  @Delete('blocks/:userId')
  unblock(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.safety.unblock(user.id, userId);
  }

  @Get('blocks')
  listBlocks(@CurrentUser() user: AuthUser) {
    return this.safety.listBlocks(user.id);
  }
}
