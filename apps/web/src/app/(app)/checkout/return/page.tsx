'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';

interface PaymentRow {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  kind: 'SUBSCRIPTION' | 'CREDIT_PACK';
  plan: string | null;
  sku: string | null;
  amount: number;
  currency: string;
  periodDays: number | null;
  failureReason: string | null;
}

/** ~60s of polling at 2s. Beyond that the webhook is late, not lost. */
const MAX_POLLS = 30;

function CheckoutReturn() {
  const params = useSearchParams();
  const paymentId = params.get('paymentId');

  const { data, isLoading, failureCount } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api<PaymentRow>(`/payments/${paymentId}`),
    enabled: Boolean(paymentId),
    // The provider redirect routinely beats its own webhook, and the
    // paymentStatus query param is user-editable — so poll our own record
    // instead of trusting anything in the URL.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && status !== 'PENDING') return false;
      return query.state.dataUpdateCount >= MAX_POLLS ? false : 2_000;
    },
    retry: 3,
  });

  if (!paymentId) {
    return (
      <Shell
        icon={<XCircle className="text-red-500" size={40} />}
        title="Paiement introuvable"
        body="Le lien de retour est incomplet."
      />
    );
  }

  if (isLoading || (!data && failureCount < 3)) {
    return (
      <Shell
        icon={<Clock className="animate-pulse text-gray-400" size={40} />}
        title="Vérification du paiement…"
        body="Un instant, nous confirmons la transaction."
      />
    );
  }

  if (data?.status === 'COMPLETED') {
    const isSub = data.kind === 'SUBSCRIPTION';
    return (
      <Shell
        icon={<CheckCircle2 className="text-green-500" size={40} />}
        title="Paiement confirmé 🎉"
        body={
          isSub
            ? `Votre accès ${data.plan ?? 'Premium'}${
                data.periodDays ? ` de ${data.periodDays} jours` : ''
              } est actif.`
            : 'Vos crédits ont été ajoutés à votre compte.'
        }
        cta={isSub ? { href: '/discover', label: 'Commencer à découvrir' } : undefined}
      />
    );
  }

  if (data?.status === 'FAILED') {
    return (
      <Shell
        icon={<XCircle className="text-red-500" size={40} />}
        title="Paiement échoué"
        body={
          data.failureReason
            ? 'La transaction n’a pas abouti. Aucun montant n’a été débité.'
            : 'La transaction a été annulée ou refusée.'
        }
        cta={{ href: '/premium', label: 'Réessayer' }}
      />
    );
  }

  // Still PENDING after the polling window: the money may yet land, so we must
  // not tell them it failed.
  return (
    <Shell
      icon={<Clock className="text-amber-500" size={40} />}
      title="Paiement en cours de traitement"
      body="Votre opérateur n'a pas encore confirmé. Cela peut prendre quelques minutes — votre accès s'activera automatiquement."
      cta={{ href: '/', label: 'Retour au tableau de bord' }}
    />
  );
}

function Shell({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md rounded-card border border-gray-100 bg-white p-8 text-center">
      <div className="mb-3 flex justify-center">{icon}</div>
      <h1 className="font-bold">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-block rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export default function CheckoutReturnPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <Shell
          icon={<Clock className="animate-pulse text-gray-400" size={40} />}
          title="Chargement…"
          body=""
        />
      }
    >
      <CheckoutReturn />
    </Suspense>
  );
}
