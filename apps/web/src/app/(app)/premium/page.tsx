'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, CalendarClock, Crown } from 'lucide-react';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDaysLeft, formatExpiry, planStatus } from '@/lib/subscription';

type PaidPlan = 'PREMIUM' | 'PREMIUM_PLUS';

interface PlansResponse {
  currency: string;
  periods: number[];
  plans: Record<PaidPlan, Record<string, number>>;
  credits: Record<
    string,
    { type: string; qty: number; priceXof: number; label: string }
  >;
}

interface ProvidersResponse {
  providers: { name: string; label: string; currencies: string[]; recurring: boolean }[];
}

const PLAN_FEATURES: Record<PaidPlan, string[]> = {
  PREMIUM: [
    'Likes illimités',
    'Voir qui vous a aimé(e)',
    'Filtres avancés',
    '1 boost par mois',
    'Coach IA',
  ],
  PREMIUM_PLUS: [
    'Tout Premium, plus :',
    'Mode incognito',
    'Super likes illimités',
    'Boosts hebdomadaires',
    'Support prioritaire',
  ],
};

const PLAN_LABEL: Record<PaidPlan, string> = {
  PREMIUM: 'Premium',
  PREMIUM_PLUS: 'Premium+',
};

/** Whole francs — XOF is zero-decimal, so never divide by 100. */
function formatXof(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function periodLabel(days: number) {
  if (days === 30) return '1 mois';
  if (days === 365) return '1 an';
  return `${Math.round(days / 30)} mois`;
}

export default function PremiumPage() {
  const { user } = useAuth();
  const status = planStatus(user?.plan, user?.planExpiresAt);
  // A Premium member has nothing to gain from buying Premium again, so the
  // default selection is the only thing left to sell them.
  const [plan, setPlan] = useState<PaidPlan>(
    user?.plan === 'PREMIUM' ? 'PREMIUM_PLUS' : 'PREMIUM',
  );
  const [periodDays, setPeriodDays] = useState(30);
  const [error, setError] = useState('');

  const { data: plans } = useQuery({
    queryKey: ['payment-plans'],
    // Prices come from the API so the client never hardcodes them.
    queryFn: () => api<PlansResponse>('/payments/plans'),
  });

  const { data: providersData, isLoading: loadingProviders } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => api<ProvidersResponse>('/payments/providers'),
    retry: false,
  });

  // One provider is configured, and its hosted page collects the payment
  // method and the mobile-money number itself — so there is nothing here for
  // the member to choose. Should a second provider ever be enabled, a picker
  // comes back; until then choosing for them is one less step before paying.
  const providers = providersData?.providers ?? [];
  const selectedProvider = providers[0];
  const selected = selectedProvider?.name ?? null;

  const checkout = useMutation({
    mutationFn: () =>
      api<{ url: string; paymentId: string }>('/payments/checkout', {
        method: 'POST',
        body: {
          plan,
          ...(selected ? { provider: selected } : {}),
          // Recurring providers bill their own cycle and ignore this.
          ...(selectedProvider?.recurring ? {} : { periodDays }),
        },
      }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.message : 'Le paiement a échoué. Réessayez.',
      );
    },
  });

  const price = plans?.plans?.[plan]?.[String(periodDays)];
  const monthly = price ? Math.round(price / (periodDays / 30)) : undefined;
  const baseMonthly = plans?.plans?.[plan]?.['30'];
  const saving =
    baseMonthly && monthly && monthly < baseMonthly
      ? Math.round(100 - (monthly / baseMonthly) * 100)
      : 0;

  const noProviders = !loadingProviders && providers.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <Crown className="mx-auto mb-2 text-brand-gold" size={32} />
        <h1 className="text-2xl font-bold">
          {status.isPaid ? 'Votre abonnement' : 'Passez Premium'}
        </h1>
        <p className="text-sm text-gray-500">
          {status.isPaid
            ? 'Prolongez quand vous voulez — le temps restant est conservé.'
            : 'Payez par Mobile Money ou carte bancaire. Sans engagement.'}
        </p>
      </div>

      {/* What they already own, and how long is left of it. */}
      {status.isPaid && (
        <div
          className={`rounded-card border p-5 ${
            status.expiringSoon
              ? 'border-amber-200 bg-amber-50'
              : 'border-brand/20 bg-brand-soft/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-brand">
                <Crown size={17} className="text-brand-gold" />
                {status.label} actif
              </div>
              {status.expiresAt && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <CalendarClock size={14} />
                  Jusqu&apos;au {formatExpiry(status.expiresAt)}
                </p>
              )}
            </div>
            {status.daysLeft !== null && (
              <div
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  status.expiringSoon ? 'bg-amber-100 text-amber-800' : 'bg-white text-brand'
                }`}
              >
                {formatDaysLeft(status.daysLeft)}
              </div>
            )}
          </div>
          {status.expiringSoon && (
            <p className="mt-3 text-xs text-amber-800">
              Le Mobile Money ne se renouvelle pas tout seul : prolongez avant la fin
              pour ne pas perdre vos avantages.
            </p>
          )}
        </div>
      )}

      {noProviders && (
        <div className="rounded-card border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
          Les paiements ne sont pas encore activés. Revenez très bientôt !
        </div>
      )}

      {!noProviders && (
        <>
          {/* Plan */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(['PREMIUM', 'PREMIUM_PLUS'] as PaidPlan[]).map((p) => {
              const active = plan === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  aria-pressed={active}
                  className={`rounded-card border p-5 text-left transition ${
                    active
                      ? 'border-brand bg-brand-soft/40 ring-1 ring-brand'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">{PLAN_LABEL[p]}</span>
                    <span className="text-sm font-semibold text-brand">
                      {plans?.plans?.[p]?.['30'] !== undefined
                        ? `${formatXof(plans.plans[p]['30'])}/mois`
                        : '—'}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {PLAN_FEATURES[p].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={15} className="mt-0.5 shrink-0 text-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Duration — only meaningful for one-shot providers. */}
          {!selectedProvider?.recurring && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Durée</h2>
              <div className="flex flex-wrap gap-2">
                {(plans?.periods ?? [30]).map((d) => {
                  const active = periodDays === d;
                  const p = plans?.plans?.[plan]?.[String(d)];
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPeriodDays(d)}
                      aria-pressed={active}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold">{periodLabel(d)}</span>
                      {p !== undefined && (
                        <span className={active ? 'ml-2 opacity-90' : 'ml-2 text-gray-500'}>
                          {formatXof(p)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {saving > 0 && (
                <p className="mt-2 text-xs text-brand">
                  Économisez {saving} % — soit {formatXof(monthly!)}/mois.
                </p>
              )}
            </div>
          )}

          {/* One-shot providers sell a window rather than a subscription, which
              the member should know before paying. */}
          {!selectedProvider?.recurring && (
            <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              Le Mobile Money ne se renouvelle pas automatiquement : vous achetez{' '}
              {periodLabel(periodDays)} d&apos;accès. Nous vous préviendrons avant
              l&apos;expiration. Vous choisirez votre opérateur et saisirez votre
              numéro sur la page de paiement sécurisée.
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => checkout.mutate()}
            disabled={checkout.isPending || !selected}
            className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white transition disabled:opacity-60"
          >
            {checkout.isPending
              ? 'Redirection…'
              : price !== undefined && !selectedProvider?.recurring
                ? `${status.isPaid ? 'Prolonger' : 'Payer'} ${formatXof(price)}`
                : 'Continuer'}
          </button>
        </>
      )}
    </div>
  );
}
