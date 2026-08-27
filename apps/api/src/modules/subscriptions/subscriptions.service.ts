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

    const existing = await this.prisma.subscription.findFirst({
      where: { providerRef: event.providerRef },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status,
          plan: event.plan,
          currentPeriodEnd: event.currentPeriodEnd ?? existing.currentPeriodEnd,
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
          currentPeriodEnd: event.currentPeriodEnd,
        },
      });
    }

    await this.prisma.user.update({ where: { id: event.userId }, data: { plan } });

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
}
