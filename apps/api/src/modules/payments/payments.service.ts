import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreditType, Payment, PaymentKind, Plan, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreditsService } from '../credits/credits.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CreditCheckoutDto } from './dto/credit-checkout.dto';
import { PaymentEvent } from './payment-provider.interface';
import {
  CREDIT_SKUS,
  CreditSku,
  PLAN_CREDIT_GRANTS,
  PLAN_PRICES_XOF,
  PaidPlan,
  PlanPeriod,
} from './pricing';
import { PaymentProviderRegistry } from './payment-provider.registry';

/**
 * Orchestrates checkout and webhook fulfilment. Provider-specific logic stays
 * in the adapters (AGENTS.md rule 1); everything here is provider-neutral.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly subscriptions: SubscriptionsService,
    private readonly credits: CreditsService,
    private readonly prisma: PrismaService,
  ) {}

  listProviders() {
    return this.registry.enabled().map((p) => ({
      name: p.name,
      label: p.label,
      currencies: p.currencies,
      recurring: p.supportsRecurring,
    }));
  }

  // -------------------------------------------------------------------------
  // Checkout
  // -------------------------------------------------------------------------

  async startSubscriptionCheckout(user: AuthUser, dto: CheckoutDto) {
    const currency = dto.currency ?? 'XOF';
    const provider = dto.provider
      ? this.registry.get(dto.provider)
      : this.registry.defaultFor(currency);

    // Recurring providers bill their own cycle; one-shot providers sell a window.
    const periodDays = provider.supportsRecurring ? undefined : (dto.periodDays ?? 30);
    const amount = provider.supportsRecurring
      ? 0 // Stripe prices live in the dashboard, keyed by STRIPE_PRICE_*.
      : PLAN_PRICES_XOF[dto.plan as PaidPlan][periodDays as PlanPeriod];

    if (!provider.supportsRecurring && !amount) {
      throw new BadRequestException(`Tarif indisponible pour ${dto.plan}/${periodDays}j`);
    }

    return this.start(user, {
      kind: 'SUBSCRIPTION',
      provider: provider.name,
      amount,
      currency,
      plan: dto.plan,
      periodDays,
      phone: dto.phone,
      description: `UnikaLove ${dto.plan}${periodDays ? ` — ${periodDays} jours` : ''}`,
    });
  }

  async startCreditCheckout(user: AuthUser, dto: CreditCheckoutDto) {
    const pack = CREDIT_SKUS[dto.sku as CreditSku];
    if (!pack) throw new BadRequestException(`Pack inconnu : ${dto.sku}`);
    const currency = dto.currency ?? 'XOF';
    const provider = dto.provider
      ? this.registry.get(dto.provider)
      : this.registry.defaultFor(currency);

    return this.start(user, {
      kind: 'CREDIT_PACK',
      provider: provider.name,
      amount: pack.priceXof,
      currency,
      sku: dto.sku,
      phone: dto.phone,
      description: `UnikaLove — ${pack.label}`,
    });
  }

  /**
   * Insert the Payment row FIRST: its id is what gets round-tripped through
   * provider metadata, so the webhook can find it even if the redirect is lost.
   */
  private async start(
    user: AuthUser,
    input: {
      kind: PaymentKind;
      provider: string;
      amount: number;
      currency: string;
      plan?: Plan;
      sku?: string;
      periodDays?: number;
      phone?: string;
      description: string;
    },
  ) {
    const provider = this.registry.get(input.provider);
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
      select: { displayName: true },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        kind: input.kind,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        plan: input.plan,
        sku: input.sku,
        periodDays: input.periodDays,
        status: 'PENDING',
      },
    });

    try {
      const result = await provider.createCheckout({
        userId: user.id,
        email: user.email,
        paymentId: payment.id,
        kind: input.kind,
        plan: input.plan,
        sku: input.sku,
        periodDays: input.periodDays,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        customer: { firstName: profile?.displayName, phone: input.phone },
      });

      if (result.providerRef) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { providerRef: result.providerRef },
        });
      }
      return { url: result.url, paymentId: payment.id };
    } catch (err) {
      // Don't leave a phantom PENDING row behind a failed initialize.
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: String(err).slice(0, 500) },
      });
      throw err;
    }
  }

  async findOne(userId: string, paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    return payment;
  }

  // -------------------------------------------------------------------------
  // Webhooks
  // -------------------------------------------------------------------------

  async ingestWebhook(providerName: string, raw: Buffer, signature: string) {
    const provider = this.registry.get(providerName);
    const events = await provider.handleWebhook(raw, signature);

    let applied = 0;
    let deduped = 0;

    for (const event of events) {
      // Unique (provider, eventId) is the dedup barrier: a retried delivery
      // loses the race here rather than granting a second entitlement.
      try {
        await this.prisma.processedWebhookEvent.create({
          data: { provider: providerName, eventId: event.eventId },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          deduped++;
          continue;
        }
        throw err;
      }

      // Defence in depth: never grant on the webhook's word alone.
      if (event.type === 'completed' && provider.verifyPayment) {
        const live = await provider.verifyPayment(event.providerRef);
        if (live && live.status !== 'completed') {
          this.logger.warn(
            `Re-query mismatch for ${event.providerRef}: webhook=completed live=${live.status}`,
          );
          await this.fail(event, `Re-query mismatch: ${live.status}`);
          continue;
        }
      }

      await this.fulfil(providerName, event);
      applied++;
    }

    return { received: true, applied, deduped };
  }

  private async resolvePayment(event: PaymentEvent): Promise<Payment | null> {
    if (event.paymentId) {
      const byId = await this.prisma.payment.findUnique({ where: { id: event.paymentId } });
      if (byId) return byId;
    }
    return this.prisma.payment.findFirst({
      where: { providerRef: event.providerRef },
    });
  }

  private async fail(event: PaymentEvent, reason: string) {
    const payment = await this.resolvePayment(event);
    if (!payment) return;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: reason.slice(0, 500) },
    });
  }

  private async fulfil(providerName: string, event: PaymentEvent) {
    const payment = await this.resolvePayment(event);

    if (event.type === 'failed') {
      await this.fail(event, event.failureReason ?? 'Paiement échoué');
      return;
    }

    // Second idempotency layer: even if the dedup row were lost, an already
    // COMPLETED payment is never granted twice.
    if (payment && payment.status === 'COMPLETED') {
      this.logger.warn(`Payment ${payment.id} already completed — skipping`);
      return;
    }

    const userId = event.userId ?? payment?.userId;
    if (!userId) {
      this.logger.warn(`Webhook ${event.eventId} has no resolvable user`);
      return;
    }

    const kind = event.kind ?? payment?.kind ?? 'SUBSCRIPTION';

    if (kind === 'CREDIT_PACK') {
      const sku = (event.sku ?? payment?.sku) as CreditSku | undefined;
      const pack = sku ? CREDIT_SKUS[sku] : undefined;
      if (!pack) {
        this.logger.warn(`Credit webhook with unknown sku ${sku}`);
        return;
      }
      // Grant and mark paid atomically — a crash between the two would
      // otherwise either double-grant on retry or silently swallow the pack.
      await this.prisma.$transaction(async (tx) => {
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
        }
        await tx.creditLedger.create({
          data: {
            userId,
            type: pack.type,
            delta: pack.qty,
            reason: 'purchase',
            paymentId: payment?.id,
          },
        });
      });
      return;
    }

    // Subscription: reuse the existing provider-neutral applier.
    const plan = (event.plan ?? payment?.plan) as Plan | undefined;
    if (!plan) {
      this.logger.warn(`Subscription webhook ${event.eventId} has no plan`);
      return;
    }

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: event.type === 'canceled' ? payment.status : 'COMPLETED',
          completedAt: event.type === 'canceled' ? payment.completedAt : new Date(),
          providerRef: payment.providerRef ?? event.providerRef,
        },
      });
    }

    // Included credits (1 boost/month on PREMIUM, etc.) ride the same
    // fulfilment path, so they are granted exactly once per activation.
    if (event.type === 'completed') {
      const grants = PLAN_CREDIT_GRANTS[plan] ?? {};
      for (const [type, qty] of Object.entries(grants)) {
        if (!qty) continue;
        await this.credits.grant(
          userId,
          type as CreditType,
          qty,
          'plan_grant',
          payment?.id,
        );
      }
    }

    await this.subscriptions.applyEvent(
      {
        type:
          event.type === 'completed'
            ? 'activated'
            : event.type === 'canceled'
              ? 'canceled'
              : event.type === 'past_due'
                ? 'past_due'
                : 'updated',
        userId,
        plan,
        providerRef: event.providerRef,
        currentPeriodEnd: event.currentPeriodEnd,
        amount: event.amount ?? payment?.amount ?? undefined,
        currency: event.currency ?? payment?.currency,
        periodDays: event.periodDays ?? payment?.periodDays ?? undefined,
      },
      providerName,
    );
  }
}
