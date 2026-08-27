import { Controller, Delete, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @HttpCode(204)
  @Delete('me')
  async deleteMe(@CurrentUser() user: AuthUser) {
    await this.users.softDelete(user.id);
  }
}
