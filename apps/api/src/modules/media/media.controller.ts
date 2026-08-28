import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { IsIn } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService, type UploadedImage } from './media.service';

const MAX_BYTES = 5 * 1024 * 1024;

class SignUploadDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /**
   * Uploads always work: `direct` means Supabase signs a URL, otherwise the
   * client posts the file here and it is stored in Postgres.
   */
  @Get('status')
  status() {
    return { uploads: true, direct: this.media.enabled };
  }

  @Post('upload-url')
  signUpload(@CurrentUser() user: AuthUser, @Body() dto: SignUploadDto) {
    return this.media.createSignedUploadUrl(user.id, dto.contentType);
  }

  /** Fallback path — the bytes pass through the API and land in Postgres. */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedImage,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    // Behind Render's proxy the scheme only survives in x-forwarded-proto.
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] ?? req.protocol;
    const base = `${proto}://${req.get('host')}${req.baseUrl || '/api/v1'}`;
    return this.media.storeInDatabase(user.id, file, base);
  }

  /** Public so an <img> tag can load it without an Authorization header. */
  @Public()
  @Get('file/:id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const file = await this.media.readFromDatabase(id);
    res.setHeader('content-type', file.mime);
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(file.data));
  }
}
