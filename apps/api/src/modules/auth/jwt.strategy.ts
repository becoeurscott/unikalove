import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';
import { accessTokenSecrets, AccessTokenPayload, verifyAccessToken } from './access-token';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // passport-jwt verifies with one key, so pick the issuer whose secret
      // actually validates; an unverifiable token gets a key that fails.
      secretOrKeyProvider: (_req: unknown, raw: string, done: (e: unknown, k?: string) => void) => {
        const secrets = accessTokenSecrets(config);
        const hit = verifyAccessToken(raw, secrets);
        const match = hit && secrets.find((s) => s.external === hit.external);
        done(null, match ? match.secret : secrets[secrets.length - 1].secret);
      },
      passReqToCallback: true,
    });
    this.secrets = accessTokenSecrets(config);
  }

  private readonly secrets: ReturnType<typeof accessTokenSecrets>;

  /**
   * InsForge owns sign-up, so the first authenticated call from a new account
   * creates its row here, keyed by the InsForge user id so every table (and
   * the socket rooms, which use the token's sub) agree on one id.
   */
  private async findOrProvision(payload: AccessTokenPayload) {
    const existing = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (existing || !payload.external) return existing;
    const clash = await this.prisma.user.findUnique({ where: { email: payload.email } });
    // A legacy account with this email has a different id; linking them is a
    // data migration, not something to guess at on a login request.
    if (clash) throw new UnauthorizedException('Compte existant : migration requise');
    return this.prisma.user.create({
      data: { id: payload.sub, email: payload.email },
    });
  }

  async validate(req: Request) {
    // Re-derive the issuer: passport hands over the decoded claims but not
    // which secret matched, and only InsForge tokens may provision a user.
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as never);
    const payload = token ? verifyAccessToken(token, this.secrets) : null;
    if (!payload) throw new UnauthorizedException();
    const user = await this.findOrProvision(payload);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();

    // Mobile money cannot auto-renew, so paid plans carry a hard expiry. Check
    // it here rather than in a cron: an expired user cannot make an
    // authenticated request without being downgraded first. Done inline with
    // Prisma (not via SubscriptionsService) to avoid a circular module import;
    // the scheduled sweep handles the user-facing notification.
    let plan = user.plan;
    if (plan !== 'FREE' && user.planExpiresAt && user.planExpiresAt < new Date()) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { plan: 'FREE', planExpiresAt: null },
        }),
        this.prisma.subscription.updateMany({
          where: { userId: user.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
          data: { status: 'EXPIRED' },
        }),
      ]);
      plan = 'FREE';
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan,
      planExpiresAt: plan === 'FREE' ? null : user.planExpiresAt,
    };
  }
}
