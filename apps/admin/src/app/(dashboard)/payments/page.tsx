'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, TrendingUp, Users } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { FadeIn } from '@/components/Motion';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface SubscriptionRow {
  id: string;
  plan: string;
  provider: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  user: { email: string; profile: { displayName: string } | null };
}

interface PaymentsData {
  mrr: number;
  currency: string;
  activeCount: number;
  byStatus: { status: string; plan: string; _count: { _all: number } }[];
  recent: SubscriptionRow[];
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api<PaymentsData>('/admin/payments'),
  });

  const totalSubs = data?.byStatus.reduce((n, r) => n + r._count._all, 0) ?? 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-gray-500">Subscriptions, MRR and recent transactions</p>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FadeIn delay={1}>
          <KpiCard
            label="MRR (estimated)"
            value={data?.mrr ?? null}
            prefix=""
            Icon={TrendingUp}
            tint="#D1FAE5"
            color="#10B981"
          />
        </FadeIn>
        <FadeIn delay={2}>
          <KpiCard
            label="Active subscriptions"
            value={data?.activeCount ?? null}
            Icon={Users}
            tint="#FDECF2"
            color="#D6336C"
          />
        </FadeIn>
        <FadeIn delay={3}>
          <KpiCard
            label="Total subscription records"
            value={totalSubs}
            Icon={CreditCard}
            tint="#EDE9FE"
            color="#8B5CF6"
          />
        </FadeIn>
      </div>

      <FadeIn delay={4}>
        <p className="text-xs text-gray-400">
          MRR is estimated from plan list prices in {data?.currency ?? 'XOF'} — replace with
          provider-reported amounts once live payments are flowing.
        </p>
      </FadeIn>

      <FadeIn delay={4} className="overflow-x-auto rounded-card border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Renews</th>
              <th className="px-5 py-3">Started</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent ?? []).map((s) => (
              <tr key={s.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium">{s.user.profile?.displayName ?? '—'}</div>
                  <div className="text-xs text-gray-400">{s.user.email}</div>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge value={s.plan} />
                </td>
                <td className="px-5 py-3 capitalize text-gray-500">{s.provider}</td>
                <td className="px-5 py-3">
                  <StatusBadge value={s.status} />
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {s.currentPeriodEnd
                    ? new Date(s.currentPeriodEnd).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.recent.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  No subscriptions yet — they appear here once Stripe checkout is live.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FadeIn>
    </div>
  );
}
