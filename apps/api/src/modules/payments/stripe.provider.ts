import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan } from '@prisma/client';
import Stripe from 'stripe';
import {
  CheckoutResult,
  PaymentProvider,
  SubscriptionEvent,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe';
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;
  private readonly appUrl: string;
  private readonly prices: Partial<Record<Plan, string>>;

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET');
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3000';
    this.prices = {
      PREMIUM: config.get<string>('STRIPE_PRICE_PREMIUM'),
      PREMIUM_PLUS: config.get<string>('STRIPE_PRICE_PREMIUM_PLUS'),
    };
    if (!this.stripe) {
      this.logger.warn('STRIPE_SECRET_KEY not set — payments run in disabled mode');
    }
  }

  get enabled(): boolean {
    return this.stripe !== null;
  }

  private client(): Stripe {
    if (!this.stripe) {
      throw new NotImplementedException(
        "Les paiements ne sont pas encore activés (clé Stripe manquante).",
      );
    }
    return this.stripe;
  }

  async createCheckout(userId: string, email: string, plan: Plan): Promise<CheckoutResult> {
    const price = this.prices[plan];
    if (!price) {
      throw new NotImplementedException(`Aucun tarif Stripe configuré pour ${plan}`);
    }
    const session = await this.client().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      // client_reference_id ties the Stripe session back to our user.
      client_reference_id: userId,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
      success_url: `${this.appUrl}/settings?checkout=success`,
      cancel_url: `${this.appUrl}/settings?checkout=cancel`,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return { url: session.url };
  }

  async cancelSubscription(providerRef: string): Promise<void> {
    await this.client().subscriptions.update(providerRef, { cancel_at_period_end: true });
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<SubscriptionEvent[]> {
    if (!this.webhookSecret) {
      throw new NotImplementedException('STRIPE_WEBHOOK_SECRET manquant');
    }
    const event = this.client().webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id ?? s.metadata?.userId;
        const plan = s.metadata?.plan as Plan | undefined;
        if (!userId || !plan) return [];
        return [
          {
            type: 'activated',
            userId,
            plan,
            providerRef: String(s.subscription ?? s.id),
            amount: s.amount_total ?? undefined,
            currency: s.currency ?? undefined,
          },
        ];
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const plan = (sub.metadata?.plan as Plan | undefined) ?? 'PREMIUM';
        if (!userId) return [];
        const periodEnd = (sub as unknown as { current_period_end?: number })
          .current_period_end;
        const type =
          event.type === 'customer.subscription.deleted' || sub.status === 'canceled'
            ? 'canceled'
            : sub.status === 'past_due'
              ? 'past_due'
              : 'updated';
        return [
          {
            type,
            userId,
            plan,
            providerRef: sub.id,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          },
        ];
      }
      default:
        this.logger.debug(`Unhandled Stripe event ${event.type}`);
        return [];
    }
  }
}
