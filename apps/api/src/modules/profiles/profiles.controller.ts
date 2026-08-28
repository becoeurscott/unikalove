import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfilesService } from './profiles.service';
import {
  AddPhotoDto,
  LifestyleDto,
  PrivacyDto,
  ProfileStepDto,
  SetInterestsDto,
  SubmitVerificationDto,
  UpdatePreferenceDto,
  UpsertProfileDto,
} from './dto/profile.dto';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.profiles.getMine(user.id);
  }

  @Put('me')
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertProfileDto) {
    return this.profiles.upsert(user.id, dto);
  }

  /** Onboarding: save one screen's worth of fields. */
  @Patch('me/step')
  saveStep(@CurrentUser() user: AuthUser, @Body() dto: ProfileStepDto) {
    return this.profiles.saveStep(user.id, dto);
  }

  @Put('me/lifestyle')
  updateLifestyle(@CurrentUser() user: AuthUser, @Body() dto: LifestyleDto) {
    return this.profiles.updateLifestyle(user.id, dto);
  }

  @Put('me/privacy')
  updatePrivacy(@CurrentUser() user: AuthUser, @Body() dto: PrivacyDto) {
    return this.profiles.updatePrivacy(user.id, dto);
  }

  @Put('me/preferences')
  updatePreference(@CurrentUser() user: AuthUser, @Body() dto: UpdatePreferenceDto) {
    return this.profiles.updatePreference(user.id, dto);
  }

  @Get('interests')
  listInterests() {
    return this.profiles.listInterests();
  }

  @Put('me/interests')
  setInterests(@CurrentUser() user: AuthUser, @Body() dto: SetInterestsDto) {
    return this.profiles.setInterests(user.id, dto);
  }

  @Post('me/photos')
  addPhoto(@CurrentUser() user: AuthUser, @Body() dto: AddPhotoDto) {
    return this.profiles.addPhoto(user.id, dto);
  }

  @Delete('me/photos/:photoId')
  removePhoto(@CurrentUser() user: AuthUser, @Param('photoId') photoId: string) {
    return this.profiles.removePhoto(user.id, photoId);
  }

  @Post('me/verification')
  submitVerification(@CurrentUser() user: AuthUser, @Body() dto: SubmitVerificationDto) {
    return this.profiles.submitVerification(user.id, dto.selfieUrl);
  }
}
