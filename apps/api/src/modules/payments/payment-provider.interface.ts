import { Plan } from '@prisma/client';

export interface CheckoutResult {
  url: string;
  /** Provider-side id, stored on Payment.providerRef. */
  providerRef?: string;
  /**
   * What the provider will actually debit, when it decides the price rather
   * than us (Chariow charges its own product's price). Persisted over our
   * expected amount so revenue reporting reflects reality.
   */
  amount?: number;
  currency?: string;
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
  /** Days bought outright, for providers that cannot auto-renew (mobile money). */
  periodDays?: number;
}

export interface CheckoutRequest {
  userId: string;
  email: string;
  /** Our Payment.id — round-tripped through provider metadata and back. */
  paymentId: string;
  kind: 'SUBSCRIPTION' | 'CREDIT_PACK';
  plan?: Plan;
  sku?: string;
  periodDays?: number;
  /** Smallest unit. XOF/XAF are zero-decimal — whole francs. */
  amount: number;
  currency: string;
  description: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    /** E.164. */
    phone?: string;
    /** ISO2 — required by providers that want a national number + country. */
    phoneCountry?: string;
    /** National number, no dialling code. */
    phoneLocal?: string;
  };
}

/**
 * Superset of SubscriptionEvent covering one-shot purchases too. Providers
 * normalise their webhook payloads into these.
 */
export interface PaymentEvent {
  /** Stable id for dedup. Synthesised from the raw body when the provider
   *  gives none (Moneroo). */
  eventId: string;
  type: 'completed' | 'failed' | 'canceled' | 'past_due' | 'updated';
  providerRef: string;
  paymentId?: string;
  userId?: string;
  kind?: 'SUBSCRIPTION' | 'CREDIT_PACK';
  plan?: Plan;
  sku?: string;
  periodDays?: number;
  amount?: number;
  currency?: string;
  currentPeriodEnd?: Date;
  failureReason?: string;
  /**
   * When the money actually moved, per the provider. A payment reconciled days
   * late must be dated then, not now, or it lands in the wrong day's revenue.
   */
  completedAt?: Date;
}

/**
 * ALL payment-provider logic lives behind this interface (hard rule 1 in
 * AGENTS.md). StripeProvider handles worldwide cards with true recurring
 * billing; MonerooProvider handles African mobile money, which is one-shot
 * only and therefore sells fixed-length entitlement windows instead.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly enabled: boolean;
  /** Lower-case HTTP header carrying this provider's webhook signature. */
  readonly signatureHeader: string;
  /**
   * True when the provider does not sign its webhooks and authenticates with a
   * shared secret in the query string instead (Chariow). The controller then
   * passes ?secret= where a signature would go.
   */
  readonly webhookSecretInQuery?: boolean;
  /** False when the provider cannot auto-renew — the caller must sell a window. */
  readonly supportsRecurring: boolean;
  readonly currencies: string[];
  /** Human label for the payment-method picker. */
  readonly label: string;

  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  cancelSubscription(providerRef: string): Promise<void>;
  /** Verify the signature and translate the payload into PaymentEvents. */
  handleWebhook(payload: Buffer, signature: string): Promise<PaymentEvent[]>;
  /**
   * Defence in depth: re-query the provider before granting anything.
   * Returns null when the provider offers no verify endpoint.
   */
  verifyPayment?(providerRef: string): Promise<{
    status: PaymentEvent['type'];
    amount?: number;
    currency?: string;
    completedAt?: Date;
  } | null>;
}

/** All registered providers, injected as an array. */
export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
