import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get()
  balances(@CurrentUser() user: AuthUser) {
    return this.credits.balances(user.id);
  }

  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.credits.history(user.id);
  }
}
