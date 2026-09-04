/**
 * Reading a paid plan's remaining time.
 *
 * Mobile money cannot auto-renew, so a subscription here is a window that runs
 * out rather than a card that gets charged again. The member has to be able to
 * see how much is left, and be warned before it lapses — these helpers are the
 * one place that decides what "soon" means.
 */

/** Inside this many days, the app starts nudging about renewal. */
export const RENEWAL_WARNING_DAYS = 7;

export const PLAN_LABEL: Record<string, string> = {
  FREE: 'Gratuit',
  PREMIUM: 'Premium',
  PREMIUM_PLUS: 'Premium+',
};

export interface PlanStatus {
  /** Any paid plan, whether or not it is close to lapsing. */
  isPaid: boolean;
  /** Whole days left, rounded up — 0 means it lapses today. */
  daysLeft: number | null;
  expiresAt: Date | null;
  /** Paid, and within the warning window. */
  expiringSoon: boolean;
  label: string;
}

export function planStatus(
  plan: string | undefined,
  planExpiresAt: string | null | undefined,
): PlanStatus {
  const isPaid = Boolean(plan && plan !== 'FREE');
  const expiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
  const valid = expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null;

  // Round up: with eleven hours left a member has "1 day", not "0".
  const daysLeft = valid
    ? Math.max(0, Math.ceil((valid.getTime() - Date.now()) / 86_400_000))
    : null;

  return {
    isPaid,
    expiresAt: valid,
    daysLeft,
    expiringSoon: isPaid && daysLeft !== null && daysLeft <= RENEWAL_WARNING_DAYS,
    label: PLAN_LABEL[plan ?? 'FREE'] ?? plan ?? 'Gratuit',
  };
}

/** "12 janvier 2027" — the date a member would recognise on a receipt. */
export function formatExpiry(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "3 jours", "1 jour", "aujourd'hui" — the countdown itself. */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return "expire aujourd'hui";
  if (daysLeft === 1) return 'expire demain';
  return `${daysLeft} jours restants`;
}
