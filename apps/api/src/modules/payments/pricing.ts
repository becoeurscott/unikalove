import { CreditType, Plan } from '@prisma/client';

/**
 * Canonical price list. Lives in the API rather than packages/shared because
 * that package has no build step (main points at raw .ts, which Node cannot
 * require at runtime). Clients read these via GET /payments/plans, so there is
 * exactly one source of truth.
 */

/** Zero-decimal currencies: the amount IS the whole unit, never x100. */
export const ZERO_DECIMAL_CURRENCIES = ['XOF', 'XAF'];

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase());
}

/** Entitlement windows sellable as a one-shot mobile-money payment. */
export const PLAN_PERIODS = [30, 90, 180, 365] as const;
export type PlanPeriod = (typeof PLAN_PERIODS)[number];

export type PaidPlan = Extract<Plan, 'PREMIUM' | 'PREMIUM_PLUS'>;

/**
 * Whole XOF francs. Mobile money cannot auto-renew, so longer windows are
 * discounted — every renewal moment is a chance to churn.
 */
export const PLAN_PRICES_XOF: Record<PaidPlan, Record<PlanPeriod, number>> = {
  PREMIUM: { 30: 2_500, 90: 6_500, 180: 12_000, 365: 21_000 },
  PREMIUM_PLUS: { 30: 5_000, 90: 13_000, 180: 24_000, 365: 42_000 },
};

/** Credits granted on each paid subscription activation (see pricing page). */
export const PLAN_CREDIT_GRANTS: Record<string, Partial<Record<CreditType, number>>> = {
  FREE: {},
  PREMIUM: { BOOST: 1 },
  PREMIUM_PLUS: { BOOST: 4, SUPER_LIKE: 10 },
};

/** A-la-carte packs. Keys are the `sku` stored on Payment. */
export const CREDIT_SKUS = {
  BOOST_1: { type: 'BOOST', qty: 1, priceXof: 1_000, label: '1 Boost' },
  BOOST_5: { type: 'BOOST', qty: 5, priceXof: 4_000, label: '5 Boosts' },
  SUPER_LIKE_10: {
    type: 'SUPER_LIKE',
    qty: 10,
    priceXof: 2_000,
    label: '10 Super Likes',
  },
  SPOTLIGHT_1: { type: 'SPOTLIGHT', qty: 1, priceXof: 3_000, label: '1 Spotlight' },
} as const satisfies Record<
  string,
  { type: CreditType; qty: number; priceXof: number; label: string }
>;

export type CreditSku = keyof typeof CREDIT_SKUS;

export const CREDIT_SKU_KEYS = Object.keys(CREDIT_SKUS) as CreditSku[];
