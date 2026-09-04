import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
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
