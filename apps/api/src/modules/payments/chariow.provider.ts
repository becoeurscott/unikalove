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
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import {
  CheckoutRequest,
  CheckoutResult,
  PaymentEvent,
  PaymentProvider,
} from './payment-provider.interface';

const TIMEOUT_MS = 15_000;

/**
 * Dialling codes we can still split without an ISO2, so an African number
 * works even when the client forgot to send its country. Longest prefix wins,
 * hence the explicit ordering rather than object key order.
 */
const AFRICAN_DIAL_CODES: [string, CountryCode][] = [
  ['225', 'CI'], ['226', 'BF'], ['227', 'NE'], ['228', 'TG'], ['229', 'BJ'],
  ['221', 'SN'], ['223', 'ML'], ['224', 'GN'], ['222', 'MR'], ['220', 'GM'],
  ['233', 'GH'], ['234', 'NG'], ['237', 'CM'], ['235', 'TD'], ['236', 'CF'],
  ['238', 'CV'], ['239', 'ST'], ['240', 'GQ'], ['241', 'GA'], ['242', 'CG'],
  ['243', 'CD'], ['250', 'RW'], ['254', 'KE'], ['255', 'TZ'], ['256', 'UG'],
  ['257', 'BI'], ['261', 'MG'], ['212', 'MA'], ['213', 'DZ'], ['216', 'TN'],
];

interface ChariowPurchase {
  id?: string;
  amount?: { value?: number; currency?: string };
  status?: string;
}

interface ChariowCheckoutResponse {
  data?: {
    purchase?: ChariowPurchase;
    payment?: { checkout_url?: string };
  };
  message?: string;
}

interface ChariowSaleResponse {
  data?: ChariowPurchase & {
    settled_at?: string;
    paid_at?: string;
    completed_at?: string;
    custom_metadata?: Record<string, string>;
  };
}

interface ChariowWebhookBody {
  event?: string;
  data?: {
    id?: string;
    sale_id?: string;
    status?: string;
    custom_metadata?: Record<string, string>;
  };
}

/**
 * Chariow — hosted checkout for African mobile money (Orange Money, Wave, MTN,
 * Moov) that also takes cards.
 *
 * Two things make it unlike Moneroo and drive most of this file:
 *
 * 1. **It charges the price of a product in its own shop.** There is no custom
 *    amount, so every plan x period and every credit pack needs a product in
 *    the Chariow dashboard, mapped here by CHARIOW_PRODUCTS. The price actually
 *    debited comes back on the response and is what we record — our own price
 *    list is only a display and a cross-check.
 * 2. **Webhooks are unsigned.** The secret travels in the URL instead, so the
 *    body is treated as a hint only: it never grants anything by itself, it
 *    just tells us which sale to re-read. PaymentsService already re-queries
 *    every 'completed' event through verifyPayment before fulfilling.
 */
@Injectable()
export class ChariowProvider implements PaymentProvider {
  readonly name = 'chariow';
  readonly label = 'Mobile Money & carte (Chariow)';
  /** Unsigned: the shared secret arrives as ?secret= instead. */
  readonly signatureHeader = 'x-chariow-secret';
  readonly webhookSecretInQuery = true;
  readonly supportsRecurring = false;
  readonly currencies = ['XOF', 'XAF', 'EUR', 'USD'];

  private readonly logger = new Logger(ChariowProvider.name);
  private readonly apiKey?: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl: string;
  private readonly appUrl: string;
  private readonly products: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('CHARIOW_API_KEY') || undefined;
    this.webhookSecret = config.get<string>('CHARIOW_WEBHOOK_SECRET') || undefined;
    this.baseUrl = (
      config.get<string>('CHARIOW_API_URL') ?? 'https://api.chariow.com/v1'
    ).replace(/\/$/, '');
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3000';
    this.products = this.parseProducts(config.get<string>('CHARIOW_PRODUCTS'));

    if (!this.apiKey) {
      this.logger.warn('CHARIOW_API_KEY not set — Chariow disabled');
    } else if (!this.webhookSecret) {
      this.logger.warn('CHARIOW_WEBHOOK_SECRET not set — Chariow disabled');
    } else if (Object.keys(this.products).length === 0) {
      this.logger.warn('CHARIOW_PRODUCTS empty — Chariow disabled (nothing to sell)');
    }
  }

  /** `{"PREMIUM_30":"prod_…","BOOST_1":"prod_…"}` — one env var, all SKUs. */
  private parseProducts(raw?: string): Record<string, string> {
    if (!raw?.trim()) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.trim()) out[k.toUpperCase()] = v.trim();
      }
      return out;
    } catch (err) {
      this.logger.error(`CHARIOW_PRODUCTS is not valid JSON: ${(err as Error).message}`);
      return {};
    }
  }

  get enabled(): boolean {
    return Boolean(
      this.apiKey && this.webhookSecret && Object.keys(this.products).length > 0,
    );
  }

  /** The catalogue key for a checkout: PLAN_DAYS for a sub, the sku for a pack. */
  static productKey(req: {
    kind: string;
    plan?: Plan | string;
    sku?: string;
    periodDays?: number;
  }): string {
    if (req.kind === 'CREDIT_PACK') return String(req.sku ?? '').toUpperCase();
    return `${String(req.plan ?? '')}_${req.periodDays ?? 30}`.toUpperCase();
  }

  private key(): string {
    if (!this.enabled) {
      throw new NotImplementedException("Le paiement Chariow n'est pas encore activé.");
    }
    return this.apiKey!;
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
    const body = (await res.json().catch(() => ({}))) as T & { message?: string };
    if (!res.ok) {
      const detail = body.message ?? res.statusText;
      // 401/403 mean OUR key is wrong — the buyer can do nothing about it, so
      // do not show them a validation error. 400/422 are about this request
      // (bad phone, dead discount code) and the message is worth surfacing.
      if (res.status === 401 || res.status === 403) {
        this.logger.error(`Chariow rejected our credentials (${res.status}): ${detail}`);
        throw new ServiceUnavailableException(
          "Le paiement est momentanément indisponible. Réessayez dans un instant.",
        );
      }
      if (res.status === 400 || res.status === 422) {
        throw new BadRequestException(`Paiement refusé : ${detail}`);
      }
      throw new ServiceUnavailableException(`Paiement indisponible (Chariow ${res.status}).`);
    }
    return body;
  }

  /**
   * Chariow wants `{ number: <national>, country_code: <ISO2> }` and rejects a
   * raw E.164 with 400 "Invalid phone number". Four attempts, first win:
   * explicit country + local, then E.164, then country + raw digits, and
   * finally an African dialling-code table. A non-African number therefore
   * needs either phoneCountry or a valid E.164.
   */
  static resolvePhone(customer?: CheckoutRequest['customer']):
    | { number: string; country_code: string }
    | undefined {
    const country = customer?.phoneCountry?.toUpperCase() as CountryCode | undefined;
    const local = customer?.phoneLocal?.trim();
    const e164 = customer?.phone?.trim();

    if (country && local) {
      const parsed = parsePhoneNumberFromString(local, country);
      if (parsed?.isValid()) {
        return { number: parsed.nationalNumber.toString(), country_code: country };
      }
    }

    if (e164) {
      const parsed = parsePhoneNumberFromString(e164);
      if (parsed?.isValid() && parsed.country) {
        return { number: parsed.nationalNumber.toString(), country_code: parsed.country };
      }
    }

    // Not valid per libphonenumber, but the country is known: send the digits
    // and let Chariow judge, rather than refusing a real number ourselves.
    if (country && (local || e164)) {
      const digits = (local ?? e164 ?? '').replace(/\D/g, '').replace(/^0+/, '');
      if (digits) return { number: digits, country_code: country };
    }

    if (e164) {
      const digits = e164.replace(/\D/g, '').replace(/^0+/, '');
      for (const [dial, iso2] of AFRICAN_DIAL_CODES) {
        if (digits.startsWith(dial) && digits.length > dial.length) {
          return { number: digits.slice(dial.length).replace(/^0+/, ''), country_code: iso2 };
        }
      }
    }

    return undefined;
  }

  /** Chariow requires both names and 400s without them. */
  private splitName(req: CheckoutRequest): { first: string; last: string } {
    const given = [req.customer?.firstName, req.customer?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const tokens = given ? given.split(/\s+/) : [];
    if (tokens.length === 0) return { first: req.email.split('@')[0] || 'Client', last: '-' };
    if (tokens.length === 1) return { first: tokens[0], last: '-' };
    return { first: tokens[0], last: tokens.slice(1).join(' ') };
  }

  /**
   * Order matters: "unpaid" contains "paid", so pending is tested first — the
   * reverse would credit an unpaid sale. "settled" means the funds landed and
   * is a success, not an intermediate state.
   */
  static mapStatus(raw: string | undefined): PaymentEvent['type'] | 'pending' {
    const s = (raw ?? '').toLowerCase();
    if (!s) return 'pending';
    if (/unpaid|awaiting|pending|processing|initiat/.test(s)) return 'pending';
    if (/fail|error|declin/.test(s)) return 'failed';
    if (/cancel|abandon|refund|expire/.test(s)) return 'canceled';
    if (/settle|complete|paid|success/.test(s)) return 'completed';
    return 'pending';
  }

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const key = ChariowProvider.productKey(req);
    const productId = this.products[key];
    if (!productId) {
      // Loud and specific: the operator has to create this product in Chariow.
      throw new BadRequestException(
        `Aucun produit Chariow configuré pour « ${key} ». Ajoutez-le à CHARIOW_PRODUCTS.`,
      );
    }

    const { first, last } = this.splitName(req);
    const phone = ChariowProvider.resolvePhone(req.customer);

    const payload = {
      product_id: productId,
      email: req.email,
      first_name: first,
      last_name: last,
      ...(phone ? { phone } : {}),
      redirect_url: `${this.appUrl}/checkout/return?paymentId=${req.paymentId}&provider=chariow`,
      custom_metadata: {
        paymentId: req.paymentId,
        userId: req.userId,
        kind: req.kind,
        ...(req.plan ? { plan: String(req.plan) } : {}),
        ...(req.sku ? { sku: req.sku } : {}),
        ...(req.periodDays ? { periodDays: String(req.periodDays) } : {}),
      },
    };

    const res = await this.request<ChariowCheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const purchase = res.data?.purchase;
    const url = res.data?.payment?.checkout_url;
    // A 200 without both is a failure: never redirect on a partial response.
    if (!purchase?.id || !url) {
      throw new Error('Chariow returned no checkout URL');
    }

    const charged = purchase.amount;
    if (charged?.value != null && charged.value !== req.amount) {
      // Not fatal — the shop price is authoritative — but it means our price
      // list and the Chariow product have drifted apart.
      this.logger.warn(
        `Chariow product ${productId} charges ${charged.value} ${charged.currency}, ` +
          `price list says ${req.amount} ${req.currency}`,
      );
    }

    return {
      url,
      providerRef: purchase.id,
      // Record what is really debited, in the shop's currency — never assume XOF.
      amount: charged?.value,
      currency: charged?.currency,
    };
  }

  async cancelSubscription(providerRef: string): Promise<void> {
    // One-shot window: nothing to cancel upstream, it simply is not renewed.
    this.logger.log(`Chariow entitlement ${providerRef} will lapse at period end`);
  }

  /** Constant-time compare of the ?secret= against the configured one. */
  private secretMatches(candidate: string): boolean {
    const a = Buffer.from((candidate ?? '').trim());
    const b = Buffer.from(this.webhookSecret ?? '');
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async handleWebhook(payload: Buffer, secret: string): Promise<PaymentEvent[]> {
    if (!this.webhookSecret) {
      throw new NotImplementedException('CHARIOW_WEBHOOK_SECRET manquant');
    }
    // A wrong secret is an authentication failure, not a server fault: answer
    // 401 so a misconfigured dashboard URL is obvious in Chariow's delivery log.
    if (!this.secretMatches(secret)) {
      throw new UnauthorizedException('Secret Chariow invalide');
    }

    const body = JSON.parse(payload.toString('utf8')) as ChariowWebhookBody;
    const saleId = body.data?.sale_id ?? body.data?.id;
    if (!saleId) return [];

    const type = ChariowProvider.mapStatus(body.data?.status ?? body.event);
    if (type === 'pending') return [];

    const meta = body.data?.custom_metadata ?? {};
    const periodDays = meta.periodDays ? Number(meta.periodDays) : undefined;

    // No stable event id from Chariow: derive one from the exact bytes, so a
    // byte-identical redelivery dedups to a single fulfilment.
    const eventId = `synthetic-${crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex')
      .slice(0, 32)}`;

    return [
      {
        eventId,
        // The body is only a hint about which sale to re-read; the service
        // re-queries every 'completed' through verifyPayment before granting.
        type: type === 'canceled' ? 'canceled' : type,
        providerRef: saleId,
        paymentId: meta.paymentId,
        userId: meta.userId,
        kind: (meta.kind as PaymentEvent['kind']) ?? 'SUBSCRIPTION',
        plan: meta.plan as Plan | undefined,
        sku: meta.sku,
        periodDays: Number.isFinite(periodDays) ? periodDays : undefined,
        failureReason: type === 'failed' ? (body.data?.status ?? body.event) : undefined,
      },
    ];
  }

  /** The source of truth: GET /sales/{id}. Used by webhook re-query and cron. */
  async verifyPayment(
    providerRef: string,
  ): Promise<{ status: PaymentEvent['type']; amount?: number; currency?: string; completedAt?: Date } | null> {
    try {
      const res = await this.request<ChariowSaleResponse>(
        `/sales/${encodeURIComponent(providerRef)}`,
      );
      const sale = res.data;
      const mapped = ChariowProvider.mapStatus(sale?.status);
      // 'pending' is not a PaymentEvent type; report it as a non-terminal update.
      const status: PaymentEvent['type'] = mapped === 'pending' ? 'updated' : mapped;

      // Date the credit when the money moved, not when we noticed — a sale
      // caught up days later must not appear as today's revenue.
      const stamp = sale?.settled_at ?? sale?.paid_at ?? sale?.completed_at;
      const completedAt = stamp ? new Date(stamp) : undefined;

      return {
        status,
        amount: sale?.amount?.value,
        currency: sale?.amount?.currency,
        completedAt: completedAt && !Number.isNaN(completedAt.getTime()) ? completedAt : undefined,
      };
    } catch (err) {
      this.logger.error(`Chariow verify failed for ${providerRef}: ${String(err)}`);
      return null;
    }
  }
}
