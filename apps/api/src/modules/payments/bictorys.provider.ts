import {
  BadRequestException,
  Injectable,
  Logger,
  NotImplementedException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan } from '@prisma/client';
import * as crypto from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  CheckoutRequest,
  CheckoutResult,
  PaymentEvent,
  PaymentProvider,
} from './payment-provider.interface';

const TIMEOUT_MS = 15_000;

/** Where the buyer is, when we cannot tell from their number. */
const DEFAULT_COUNTRY = 'SN';

interface BictorysChargeResponse {
  /** 202 hosted checkout. */
  type?: string;
  link?: string;
  chargeId?: string;
  opToken?: string;
  /** 201 direct / mobile-money confirmation. */
  transactionId?: string;
  redirectUrl?: string;
  merchantReference?: string;
  message?: string;
  state?: string;
  /** Errors. */
  title?: string;
  details?: string;
}

interface BictorysTransaction {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
  paymentReference?: string;
  merchantReference?: string;
}

interface BictorysWebhookBody {
  id?: string;
  transactionId?: string;
  chargeId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  paymentReference?: string;
  merchantReference?: string;
  type?: string;
}

/**
 * Bictorys — West African mobile money (Wave, Orange Money, Free Money, MTN,
 * Moov, Maxit, Mobicash, Togocell) plus cards, over one hosted checkout.
 *
 * Unlike Chariow it accepts an arbitrary amount, so `pricing.ts` stays the only
 * source of truth: there is no product catalogue to keep in step, and no way
 * for the advertised price and the debited price to drift apart.
 *
 * Its webhook carries a shared secret in a header and is NOT signed, so the
 * body is only a hint about which charge to re-read. PaymentsService re-queries
 * every completed event through verifyPayment before granting anything, which
 * is what actually makes this safe.
 */
@Injectable()
export class BictorysProvider implements PaymentProvider {
  readonly name = 'bictorys';
  readonly label = 'Mobile Money & carte';
  /** Not a signature — a shared secret compared verbatim. */
  readonly signatureHeader = 'x-secret-key';
  readonly supportsRecurring = false;
  readonly currencies = ['XOF', 'XAF'];

  private readonly logger = new Logger(BictorysProvider.name);
  private readonly secretKey?: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    // Trimmed: a key pasted into a dashboard field very often arrives with a
    // trailing newline or space, which the provider rejects as a wrong key.
    this.secretKey = config.get<string>('BICTORYS_SECRET_KEY')?.trim() || undefined;
    this.webhookSecret = config.get<string>('BICTORYS_WEBHOOK_SECRET')?.trim() || undefined;
    this.baseUrl = (
      config.get<string>('BICTORYS_API_URL') ?? 'https://api.bictorys.com'
    ).replace(/\/$/, '');
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3000';

    if (!this.secretKey) {
      this.logger.warn('BICTORYS_SECRET_KEY not set — Bictorys disabled');
    } else if (!this.webhookSecret) {
      // Without it we cannot tell a real callback from a forged one.
      this.logger.warn('BICTORYS_WEBHOOK_SECRET not set — Bictorys disabled');
    }
  }

  get enabled(): boolean {
    return Boolean(this.secretKey && this.webhookSecret);
  }

  private key(): string {
    if (!this.enabled) {
      throw new NotImplementedException("Le paiement mobile n'est pas encore activé.");
    }
    return this.secretKey!;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'X-API-Key': this.key(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // Echoed in Bictorys' logs, so a support ticket can name one request.
        'Request-Id': crypto.randomUUID(),
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = (await res.json().catch(() => ({}))) as T & {
      title?: string;
      details?: string;
    };
    if (!res.ok) {
      const detail = body.details ?? body.title ?? res.statusText;
      // 401/403 mean our key is wrong: the buyer can do nothing about that.
      if (res.status === 401 || res.status === 403) {
        this.logger.error(`Bictorys rejected our credentials (${res.status}): ${detail}`);
        throw new ServiceUnavailableException(
          'Le paiement est momentanément indisponible. Réessayez dans un instant.',
        );
      }
      if (res.status === 400 || res.status === 422) {
        throw new BadRequestException(`Paiement refusé : ${detail}`);
      }
      throw new ServiceUnavailableException(`Paiement indisponible (Bictorys ${res.status}).`);
    }
    return body;
  }

  /**
   * Bictorys wants the number in international form without a plus, and a
   * separate ISO2 country. libphonenumber gives us both from an E.164; an
   * explicit phoneCountry wins when the client sent one.
   */
  static resolvePhone(customer?: CheckoutRequest['customer']): {
    phone?: string;
    country: string;
  } {
    const explicit = customer?.phoneCountry?.toUpperCase();
    const e164 = customer?.phone?.trim();

    if (e164) {
      const parsed = parsePhoneNumberFromString(e164);
      if (parsed?.isValid()) {
        return {
          phone: parsed.number.replace('+', ''),
          country: explicit || parsed.country || DEFAULT_COUNTRY,
        };
      }
      // Not parseable, but a country was given: send the digits and let
      // Bictorys judge rather than refusing a real number ourselves.
      const digits = e164.replace(/\D/g, '');
      if (digits) return { phone: digits, country: explicit || DEFAULT_COUNTRY };
    }

    if (explicit && customer?.phoneLocal) {
      const parsed = parsePhoneNumberFromString(customer.phoneLocal, explicit as never);
      if (parsed?.isValid()) {
        return { phone: parsed.number.replace('+', ''), country: explicit };
      }
    }

    // No usable number: the hosted checkout will collect one.
    return { phone: undefined, country: explicit || DEFAULT_COUNTRY };
  }

  /**
   * Only `succeeded` means the money is ours. `authorized` is a card hold that
   * the docs say to treat as good — we do, but every completed event is
   * re-queried before it grants anything, so a hold that never captures cannot
   * quietly become a subscription.
   *
   * Order matters, as with any status matcher: the pending family is tested
   * first so a value that merely contains a success word cannot slip through.
   */
  static mapStatus(raw: string | undefined): PaymentEvent['type'] | 'pending' {
    const s = (raw ?? '').toLowerCase().trim();
    if (!s) return 'pending';
    if (/pending|processing|initi|attente|en_cours/.test(s)) return 'pending';
    if (/fail|echou|échou|declin|reject|error/.test(s)) return 'failed';
    if (/cancel|annul|expir|revers|refund/.test(s)) return 'canceled';
    if (/succeed|success|succes|succès|authorized|autoris|captur|paid/.test(s)) {
      return 'completed';
    }
    return 'pending';
  }

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.currencies.includes(req.currency)) {
      throw new NotImplementedException(`Bictorys ne gère pas la devise ${req.currency}`);
    }
    const { phone, country } = BictorysProvider.resolvePhone(req.customer);
    const name = [req.customer?.firstName, req.customer?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const payload = {
      // XOF/XAF are zero-decimal: whole francs, never centimes.
      amount: req.amount,
      currency: req.currency,
      country,
      // Our Payment.id round-trips here and comes back on the webhook, which
      // is how a callback is tied to the right row without trusting its body.
      paymentReference: req.paymentId,
      merchantReference: req.paymentId,
      successRedirectUrl: `${this.appUrl}/checkout/return?paymentId=${req.paymentId}&provider=bictorys`,
      errorRedirectUrl: `${this.appUrl}/checkout/return?paymentId=${req.paymentId}&provider=bictorys&status=failed`,
      customerObject: {
        name: name || req.email.split('@')[0] || 'Client',
        email: req.email,
        ...(phone ? { phone } : {}),
        country,
        locale: 'fr-FR',
      },
    };

    const res = await this.request<BictorysChargeResponse>('/pay/v1/charges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // 202 gives a hosted checkout link; 201 gives a confirmation link for a
    // mobile-money push. Either way we need somewhere to send the buyer.
    const url = res.link ?? res.redirectUrl;
    const providerRef = res.chargeId ?? res.transactionId;
    if (!url || !providerRef) {
      this.logger.error(`Bictorys returned no usable link: ${JSON.stringify(res).slice(0, 300)}`);
      throw new ServiceUnavailableException("Le paiement n'a pas pu être démarré.");
    }

    return { url, providerRef };
  }

  async cancelSubscription(providerRef: string): Promise<void> {
    // One-shot window: nothing upstream to cancel, it simply is not renewed.
    this.logger.log(`Bictorys entitlement ${providerRef} will lapse at period end`);
  }

  /** Constant-time compare — the header is a shared secret, not a signature. */
  private secretMatches(candidate: string): boolean {
    const a = Buffer.from((candidate ?? '').trim());
    const b = Buffer.from(this.webhookSecret ?? '');
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async handleWebhook(payload: Buffer, secret: string): Promise<PaymentEvent[]> {
    if (!this.webhookSecret) {
      throw new NotImplementedException('BICTORYS_WEBHOOK_SECRET manquant');
    }
    if (!this.secretMatches(secret)) {
      // 401 rather than 500, so a misconfigured dashboard is obvious.
      throw new UnauthorizedException('Secret Bictorys invalide');
    }

    const body = JSON.parse(payload.toString('utf8')) as BictorysWebhookBody;
    const providerRef = body.transactionId ?? body.chargeId ?? body.id;
    if (!providerRef) return [];

    const type = BictorysProvider.mapStatus(body.status);
    if (type === 'pending') return []; // nothing to act on yet

    // Bictorys ships no stable event id, so derive one from the exact bytes:
    // a byte-identical redelivery then dedups to a single fulfilment.
    const eventId = `synthetic-${crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex')
      .slice(0, 32)}`;

    return [
      {
        eventId,
        type,
        providerRef,
        // paymentReference is our own Payment.id, sent at charge creation.
        paymentId: body.paymentReference ?? body.merchantReference,
        amount: body.amount,
        currency: body.currency,
        failureReason: type === 'failed' ? (body.status ?? 'failed') : undefined,
      },
    ];
  }

  /** Source of truth for the webhook re-query and the reconciliation sweep. */
  async verifyPayment(providerRef: string): Promise<{
    status: PaymentEvent['type'];
    amount?: number;
    currency?: string;
    completedAt?: Date;
  } | null> {
    try {
      const tx = await this.request<BictorysTransaction>(
        `/pay/v1/transactions/${encodeURIComponent(providerRef)}`,
      );
      const mapped = BictorysProvider.mapStatus(tx.status);
      // 'pending' is not a PaymentEvent type; report it as non-terminal.
      const status: PaymentEvent['type'] = mapped === 'pending' ? 'updated' : mapped;

      // Date the credit when Bictorys recorded it, not when we noticed — a
      // sale reconciled days later must not land in today's revenue.
      const stamp = tx.timestamp ? new Date(tx.timestamp) : undefined;

      return {
        status,
        amount: tx.amount,
        currency: tx.currency,
        completedAt: stamp && !Number.isNaN(stamp.getTime()) ? stamp : undefined,
      };
    } catch (err) {
      this.logger.error(`Bictorys verify failed for ${providerRef}: ${String(err)}`);
      return null;
    }
  }
}
