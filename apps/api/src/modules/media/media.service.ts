import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

const BUCKET = 'profile-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadTicket {
  /** URL the client PUTs the file to. */
  uploadUrl: string;
  /** Public URL to store on the Photo row once the PUT succeeds. */
  publicUrl: string;
  path: string;
}

/**
 * Profile photo storage on Supabase Storage. The API mints a short-lived signed
 * upload URL so the file goes browser -> Supabase directly; the image bytes
 * never pass through this server.
 *
 * Without SUPABASE_SERVICE_ROLE_KEY the module reports itself disabled and
 * uploads return 501, matching how payments degrade without Stripe keys.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly url?: string;
  private readonly serviceKey?: string;

  constructor(config: ConfigService) {
    this.url = config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    this.serviceKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!this.enabled) {
      this.logger.warn('SUPABASE_SERVICE_ROLE_KEY not set — photo upload disabled');
    }
  }

  get enabled(): boolean {
    return Boolean(this.url && this.serviceKey);
  }

  private assertEnabled() {
    if (!this.enabled) {
      throw new NotImplementedException(
        "L'envoi de photos n'est pas encore activé sur ce serveur.",
      );
    }
  }

  /** Creates the bucket on first use; safe to call repeatedly. */
  private async ensureBucket(): Promise<void> {
    try {
      await fetch(`${this.url}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey!,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: BUCKET,
          name: BUCKET,
          public: true,
          file_size_limit: MAX_BYTES,
          allowed_mime_types: ALLOWED,
        }),
      });
      // A 400 "already exists" is the expected steady state — ignore it.
    } catch (err) {
      this.logger.warn(`Bucket check failed: ${(err as Error).message}`);
    }
  }

  async createSignedUploadUrl(userId: string, contentType: string): Promise<UploadTicket> {
    this.assertEnabled();
    if (!ALLOWED.includes(contentType)) {
      throw new NotImplementedException(`Format non supporté : ${contentType}`);
    }
    await this.ensureBucket();

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    // Namespaced by user so one account can never overwrite another's photo.
    const path = `${userId}/${randomUUID()}.${ext}`;

    const res = await fetch(
      `${this.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey!,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 600 }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Supabase sign failed ${res.status}: ${body.slice(0, 200)}`);
      throw new NotImplementedException("Impossible de préparer l'envoi de la photo.");
    }
    const { url: signed } = (await res.json()) as { url: string };

    return {
      uploadUrl: `${this.url}/storage/v1${signed}`,
      publicUrl: `${this.url}/storage/v1/object/public/${BUCKET}/${path}`,
      path,
    };
  }

  /** Removes a stored object; failures are logged, never thrown at the user. */
  async remove(path: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await fetch(`${this.url}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${this.serviceKey}`, apikey: this.serviceKey! },
      });
    } catch (err) {
      this.logger.warn(`Delete failed for ${path}: ${(err as Error).message}`);
    }
  }
}
