import { Plan } from '@prisma/client';

export interface CheckoutResult {
  url: string;
}

/** Normalised subscription event emitted by any provider's webhook. */
export interface SubscriptionEvent {
  type: 'activated' | 'updated' | 'canceled' | 'past_due';
  userId: string;
  plan: Plan;
  providerRef: string;
  currentPeriodEnd?: Date;
  amount?: number;
  currency?: string;
}

/**
 * ALL payment-provider logic lives behind this interface (hard rule 1 in
 * AGENTS.md). StripeProvider implements it today; FlutterwaveProvider
 * (Mobile Money) plugs in later without touching business logic.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly enabled: boolean;
  createCheckout(userId: string, email: string, plan: Plan): Promise<CheckoutResult>;
  cancelSubscription(providerRef: string): Promise<void>;
  /** Verify the signature and translate the payload into SubscriptionEvents. */
  handleWebhook(payload: Buffer, signature: string): Promise<SubscriptionEvent[]>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
