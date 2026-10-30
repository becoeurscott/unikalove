import { ConfigService } from '@nestjs/config';
import { verify, type JwtPayload as RawPayload } from 'jsonwebtoken';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  /** True when InsForge (not this API) issued the token. */
  external: boolean;
}

/**
 * During the InsForge migration two issuers are valid: InsForge Auth (the web
 * app's sign-in) and this API's legacy /auth/login. Both are HS256; the
 * InsForge secret is tried first because that is where traffic is heading.
 */
export function accessTokenSecrets(config: ConfigService): { secret: string; external: boolean }[] {
  const insforge = config.get<string>('INSFORGE_JWT_SECRET');
  return [
    ...(insforge ? [{ secret: insforge, external: true }] : []),
    { secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'), external: false },
  ];
}

/** Verified payload, or null for anything forged, expired or malformed. */
export function verifyAccessToken(
  token: string,
  secrets: { secret: string; external: boolean }[],
): AccessTokenPayload | null {
  for (const { secret, external } of secrets) {
    try {
      const p = verify(token, secret, { algorithms: ['HS256'] }) as RawPayload;
      if (typeof p.sub === 'string' && typeof p.email === 'string') {
        return { sub: p.sub, email: p.email.toLowerCase(), external };
      }
    } catch {
      /* try the next issuer */
    }
  }
  return null;
}
