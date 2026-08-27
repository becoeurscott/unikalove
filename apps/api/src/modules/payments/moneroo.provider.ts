import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan } from '@prisma/client';
import * as crypto from 'node:crypto';
import {
  CheckoutRequest,
  CheckoutResult,
  PaymentEvent,
  PaymentProvider,
} from './payment-provider.interface';

const TIMEOUT_MS = 15_000;
const MAX_DESCRIPTION = 200;

interface MonerooInitResponse {
  data?: { id?: string; checkout_url?: string };
  message?: string;
  errors?: Record<string, string[]>;
}

interface MonerooWebhookBody {
  event?: string;
  data?: {
    id?: string;
    amount?: number;
    currency?: string | { code?: string };
    status?: string;
    metadata?: Record<string, string>;
  };
}

/**
 * Moneroo — hosted aggregator covering African mobile money (Wave, Orange
 * Money, MTN, Moov, Free Money...) plus cards, in XOF and XAF.
 *
 * Mobile money has no mandate/auto-debit concept, so this provider cannot
 * renew anything. It sells a fixed entitlement window (periodDays) as a
 * one-shot payment; PaymentsService is responsible for expiry and reminders.
 */
@Injectable()
export class MonerooProvider implements PaymentProvider {
  readonly name = 'moneroo';
  readonly label = 'Mobile Money';
  readonly signatureHeader = 'x-moneroo-signature';
  readonly supportsRecurring = false;
  readonly currencies = ['XOF', 'XAF'];

  private readonly logger = new Logger(MonerooProvider.name);
  private readonly secretKey?: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get<string>('MONEROO_SECRET_KEY') || undefined;
    this.webhookSecret = config.get<string>('MONEROO_WEBHOOK_SECRET') || undefined;
    this.baseUrl = config.get<string>('MONEROO_BASE_URL') ?? 'https://api.moneroo.io';
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3000';

    if (!this.secretKey) {
      this.logger.warn('MONEROO_SECRET_KEY not set — Mobile Money disabled');
    } else if (!this.webhookSecret) {
      // Without it we cannot verify callbacks, so we must not take money.
      this.logger.warn('MONEROO_WEBHOOK_SECRET not set — Mobile Money disabled');
    }
  }

  get enabled(): boolean {
    return Boolean(this.secretKey && this.webhookSecret);
  }

  private key(): string {
    if (!this.secretKey || !this.webhookSecret) {
      throw new NotImplementedException(
        "Le paiement Mobile Money n'est pas encore activé.",
      );
    }
    return this.secretKey;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.key()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as T & {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (!res.ok) {
      const detail = body.errors
        ? Object.entries(body.errors)
            .map(([k, v]) => `${k}: ${v.join(', ')}`)
            .join(' | ')
        : (body.message ?? res.statusText);
      throw new Error(`Moneroo ${res.status}: ${detail}`);
    }
    return body;
  }

  /**
   * Moneroo requires first_name AND last_name and rejects the request outright
   * when either is missing. Fall back to the email local-part, then to "-".
   */
  private splitName(req: CheckoutRequest): { first: string; last: string } {
    const given = [req.customer?.firstName, req.customer?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const tokens = given ? given.split(/\s+/) : [];
    if (tokens.length === 0) {
      return { first: req.email.split('@')[0] || 'Client', last: '-' };
    }
    if (tokens.length === 1) return { first: tokens[0], last: '-' };
    return { first: tokens[0], last: tokens.slice(1).join(' ') };
  }

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.currencies.includes(req.currency)) {
      throw new NotImplementedException(
        `Moneroo ne gère pas la devise ${req.currency}`,
      );
    }
    const { first, last } = this.splitName(req);

    // Moneroo rejects non-string metadata values with a 422 — stringify all,
    // and drop empties rather than sending nulls.
    const metadata: Record<string, string> = {};
    for (const [k, v] of Object.entries({
      paymentId: req.paymentId,
      userId: req.userId,
      kind: req.kind,
      plan: req.plan,
      sku: req.sku,
      periodDays: req.periodDays,
    })) {
      if (v !== undefined && v !== null && String(v).length > 0) metadata[k] = String(v);
    }

    const payload = {
      // XOF/XAF are zero-decimal: this is whole francs, NOT centimes.
      amount: req.amount,
      currency: req.currency,
      description: req.description.slice(0, MAX_DESCRIPTION),
      // There is no cancel_url — return_url is the only redirect Moneroo takes.
      return_url: `${this.appUrl}/checkout/return?paymentId=${req.paymentId}`,
      customer: {
        email: req.email,
        first_name: first,
        last_name: last,
        ...(req.customer?.phone ? { phone: req.customer.phone } : {}),
      },
      metadata,
    };

    let res: MonerooInitResponse;
    try {
      res = await this.request<MonerooInitResponse>('/v1/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // One retry only: initialize is safe to repeat (no charge yet), whereas
      // verify/status must not be hammered — the next webhook will arrive.
      this.logger.warn(`Moneroo initialize failed, retrying once: ${String(err)}`);
      res = await this.request<MonerooInitResponse>('/v1/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // A 200 with a missing id or url is a failure, not a success.
    if (!res.data?.id || !res.data?.checkout_url) {
      throw new Error('Moneroo returned no checkout URL');
    }
    return { url: res.data.checkout_url, providerRef: res.data.id };
  }

  async cancelSubscription(providerRef: string): Promise<void> {
    // Nothing to cancel provider-side: a one-shot window simply is not renewed.
    // PaymentsService flips the local subscription to cancel-at-expiry.
    this.logger.log(`Moneroo entitlement ${providerRef} will lapse at period end`);
  }

  private verifySignature(rawBody: Buffer, signature: string): boolean {
    // HMAC must be over the RAW bytes — re-stringifying JSON reorders keys and
    // changes whitespace, and the digest will never match.
    const expected = crypto
      .createHmac('sha256', this.webhookSecret!)
      .update(rawBody)
      .digest('hex');
    const a = Buffer.from(signature.trim());
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private static currencyOf(c: string | { code?: string } | undefined): string | undefined {
    // Moneroo returns "XOF" from the webhook but { code: "XOF" } from verify.
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object' && 'code' in c) return (c as { code?: string }).code;
    return undefined;
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<PaymentEvent[]> {
    if (!this.webhookSecret) {
      throw new NotImplementedException('MONEROO_WEBHOOK_SECRET manquant');
    }
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Signature Moneroo invalide');
    }

    const body = JSON.parse(payload.toString('utf8')) as MonerooWebhookBody;
    const data = body.data;
    if (!data?.id) return [];

    // Moneroo ships no stable event id, so derive one from the exact bytes.
    // Byte-identical redelivery therefore dedups to a single fulfilment.
    const eventId = `synthetic-${crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex')
      .slice(0, 32)}`;

    let type: PaymentEvent['type'];
    switch (body.event) {
      case 'payment.success':
        type = 'completed';
        break;
      case 'payment.failed':
      case 'payment.cancelled':
        type = 'failed';
        break;
      case 'payment.initiated':
        // Informational only — our row is already PENDING. Acting on it would
        // grant an entitlement before the money moves.
        return [];
      default:
        this.logger.debug(`Unhandled Moneroo event ${body.event}`);
        return [];
    }

    const meta = data.metadata ?? {};
    const periodDays = meta.periodDays ? Number(meta.periodDays) : undefined;

    return [
      {
        eventId,
        type,
        providerRef: data.id,
        paymentId: meta.paymentId,
        userId: meta.userId,
        kind: (meta.kind as PaymentEvent['kind']) ?? 'SUBSCRIPTION',
        plan: meta.plan as Plan | undefined,
        sku: meta.sku,
        periodDays: Number.isFinite(periodDays) ? periodDays : undefined,
        amount: data.amount,
        currency: MonerooProvider.currencyOf(data.currency),
        failureReason: type === 'failed' ? (data.status ?? body.event) : undefined,
      },
    ];
  }

  /**
   * Re-query before granting. A forged-but-correctly-signed replay, or a
   * webhook that disagrees with reality, is caught here.
   */
  async verifyPayment(providerRef: string): Promise<{ status: PaymentEvent['type'] } | null> {
    try {
      const res = await this.request<{ data?: { status?: string } }>(
        `/v1/payments/${encodeURIComponent(providerRef)}/verify`,
      );
      const live = res.data?.status;
      if (live === 'success' || live === 'succeeded') return { status: 'completed' };
      if (live === 'pending') return { status: 'updated' };
      return { status: 'failed' };
    } catch (err) {
      this.logger.error(`Moneroo verify failed for ${providerRef}: ${String(err)}`);
      return null;
    }
  }
}
