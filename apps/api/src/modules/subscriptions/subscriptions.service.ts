import { Injectable, Logger } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionEvent } from '../payments/payment-provider.interface';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Subscription rows are the source of truth; User.plan is a denormalised copy
 * kept in sync here so entitlement guards stay a single fast read.
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async currentPlan(userId: string): Promise<Plan> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    return user.plan;
  }

  mine(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Applies one normalised provider event. Idempotent per providerRef. */
  async applyEvent(event: SubscriptionEvent, provider: string) {
    const user = await this.prisma.user.findUnique({ where: { id: event.userId } });
    if (!user) {
      this.logger.warn(`Webhook for unknown user ${event.userId}`);
      return;
    }

    const status =
      event.type === 'canceled'
        ? 'CANCELED'
        : event.type === 'past_due'
          ? 'PAST_DUE'
          : 'ACTIVE';
    // past_due keeps the paid plan until the period ends (grace period).
    const plan: Plan = event.type === 'canceled' ? 'FREE' : event.plan;

    // One-shot providers (mobile money) buy a fixed window. Stack it onto any
    // remaining time rather than overwriting, so paying early never loses days.
    let planExpiresAt: Date | null | undefined;
    if (event.type === 'canceled') {
      planExpiresAt = null;
    } else if (event.periodDays) {
      const base =
        user.planExpiresAt && user.planExpiresAt > new Date()
          ? user.planExpiresAt
          : new Date();
      planExpiresAt = new Date(base.getTime() + event.periodDays * 86_400_000);
    } else if (event.currentPeriodEnd) {
      planExpiresAt = event.currentPeriodEnd;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { provider, providerRef: event.providerRef },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status,
          plan: event.plan,
          currentPeriodEnd:
            planExpiresAt ?? event.currentPeriodEnd ?? existing.currentPeriodEnd,
          amount: event.amount ?? existing.amount,
          currency: event.currency ?? existing.currency,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId: event.userId,
          plan: event.plan,
          provider,
          providerRef: event.providerRef,
          status,
          currentPeriodEnd: planExpiresAt ?? event.currentPeriodEnd,
          amount: event.amount,
          currency: event.currency ?? 'XOF',
        },
      });
    }

    await this.prisma.user.update({
      where: { id: event.userId },
      data: { plan, ...(planExpiresAt !== undefined ? { planExpiresAt } : {}) },
    });

    if (event.type === 'activated') {
      await this.notifications.create(
        event.userId,
        'SYSTEM',
        'Bienvenue dans Premium ! 🎉',
        { plan: event.plan },
        'Vos likes illimités et les profils qui vous aiment sont désormais accessibles.',
      );
    }
    if (event.type === 'canceled') {
      await this.notifications.create(
        event.userId,
        'SYSTEM',
        'Abonnement terminé',
        { plan: event.plan },
        'Votre compte est repassé en formule Gratuit.',
      );
    }
  }

  /**
   * Drop a lapsed user to FREE. Called lazily from the JWT strategy, so an
   * expired user cannot make an authenticated request without being
   * downgraded first — correct by construction, no cron required.
   */
  async expire(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: 'FREE', planExpiresAt: null },
      }),
      this.prisma.subscription.updateMany({
        where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        data: { status: 'EXPIRED' },
      }),
    ]);
    await this.notifications.create(
      userId,
      'SYSTEM',
      'Votre abonnement a expiré',
      {},
      'Rechargez en Mobile Money pour retrouver vos likes illimités.',
    );
  }

  /**
   * Renewal reminders + downgrade sweep. Driven by an external scheduler: a
   * user who stops opening the app never triggers the lazy path, and Render's
   * free tier sleeps so an in-process cron would not fire reliably.
   */
  async sweepExpiries(): Promise<{ reminded: number; expired: number }> {
    const now = new Date();
    const soon = (days: number) => new Date(now.getTime() + days * 86_400_000);

    // J-3 and J-1 warnings, for paid users with a fixed window.
    const upcoming = await this.prisma.user.findMany({
      where: {
        plan: { not: 'FREE' },
        planExpiresAt: { gt: now, lte: soon(3) },
      },
      select: { id: true, planExpiresAt: true },
    });

    let reminded = 0;
    for (const user of upcoming) {
      const daysLeft = Math.ceil(
        (user.planExpiresAt!.getTime() - now.getTime()) / 86_400_000,
      );
      if (daysLeft !== 3 && daysLeft !== 1) continue;
      await this.notifications.create(
        user.id,
        'SYSTEM',
        daysLeft === 1
          ? 'Votre abonnement expire demain'
          : 'Votre abonnement expire dans 3 jours',
        { daysLeft },
        'Rechargez en Mobile Money pour ne pas perdre vos avantages.',
      );
      reminded++;
    }

    const lapsed = await this.prisma.user.findMany({
      where: { plan: { not: 'FREE' }, planExpiresAt: { lt: now } },
      select: { id: true },
    });
    for (const user of lapsed) await this.expire(user.id);

    this.logger.log(`Sweep: ${reminded} reminded, ${lapsed.length} expired`);
    return { reminded, expired: lapsed.length };
  }
}
