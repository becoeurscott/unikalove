import { Injectable, NotImplementedException } from '@nestjs/common';

/** S3-compatible signed uploads land with the storage provider (Phase 3). */
@Injectable()
export class MediaService {
  async createSignedUploadUrl(_userId: string, _contentType: string): Promise<{ url: string }> {
    throw new NotImplementedException('Signed uploads land with the storage provider');
  }
}
