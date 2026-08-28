import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';

class SignUploadDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Lets the client hide the upload UI when storage is not configured. */
  @Get('status')
  status() {
    return { uploads: this.media.enabled };
  }

  @Post('upload-url')
  signUpload(@CurrentUser() user: AuthUser, @Body() dto: SignUploadDto) {
    return this.media.createSignedUploadUrl(user.id, dto.contentType);
  }
}
