'use client';

import { CalendarClock, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { formatDaysLeft, planStatus } from '@/lib/subscription';

/**
 * Warns a paying member before their window closes.
 *
 * Mobile money cannot auto-renew, so lapsing is silent unless we say something:
 * one day the extra features are simply gone. This is the warning, shown only
 * inside the last week and dismissible for that day — a banner that cannot be
 * closed becomes furniture and stops being read.
 */
export function RenewalBanner() {
  const { user } = useAuth();
  const status = planStatus(user?.plan, user?.planExpiresAt);
  const [dismissed, setDismissed] = useState(true);

  // Keyed by day, so dismissing it today still warns again tomorrow — the
  // message gets more urgent as the date approaches, not less.
  const key = `unika_renewal_dismissed_${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(key) === '1');
    } catch {
      setDismissed(false); // storage blocked: better shown than hidden
    }
  }, [key]);

  if (!status.expiringSoon || dismissed || status.daysLeft === null) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
      <CalendarClock size={17} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-900">
        Votre accès {status.label}{' '}
        <strong>{formatDaysLeft(status.daysLeft)}</strong>. Le Mobile Money ne se
        renouvelle pas automatiquement —{' '}
        <Link href="/premium" className="font-semibold underline">
          prolongez maintenant
        </Link>{' '}
        pour ne rien perdre.
      </p>
      <button
        type="button"
        aria-label="Masquer"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(key, '1');
          } catch {
            /* nothing to persist to — it will reappear on the next page */
          }
        }}
        className="shrink-0 rounded p-1 text-amber-600 transition hover:bg-amber-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}
