import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportStatus, Role, UserStatus } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

class SetStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

class ResolveReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}

class ReviewVerificationDto {
  @IsBoolean()
  approve: boolean;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('kpis')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  kpis() {
    return this.admin.kpis();
  }

  @Get('top-users')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  topUsers() {
    return this.admin.topUsers();
  }

  @Get('activity')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  recentActivity() {
    return this.admin.recentActivity();
  }

  @Get('payments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  payments() {
    return this.admin.payments();
  }

  @Get('users')
  @ApiQuery({ name: 'search', required: false })
  listUsers(@Query('search') search?: string) {
    return this.admin.listUsers(search);
  }

  @Patch('users/:id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  setUserStatus(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.admin.setUserStatus(actor.id, id, dto.status);
  }

  @Get('reports')
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  listReports(@Query('status') status?: ReportStatus) {
    return this.admin.listReports(status);
  }

  @Patch('reports/:id')
  resolveReport(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.admin.resolveReport(actor.id, id, dto.status);
  }

  @Get('verifications')
  listVerifications() {
    return this.admin.listVerifications();
  }

  @Patch('verifications/:id')
  reviewVerification(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.admin.reviewVerification(actor.id, id, dto.approve);
  }
}
