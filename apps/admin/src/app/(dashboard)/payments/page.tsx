'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, TrendingUp, Users } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { FadeIn } from '@/components/Motion';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface PaymentRow {
  id: string;
  kind: 'SUBSCRIPTION' | 'CREDIT_PACK';
  plan: string | null;
  sku: string | null;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  periodDays: number | null;
  createdAt: string;
  completedAt: string | null;
  user: { email: string; profile: { displayName: string } | null };
}

interface MoneyByCurrency {
  currency: string;
  amount: number;
  count?: number;
}

interface PaymentsData {
  activeCount: number;
  byStatus: { status: string; plan: string; _count: { _all: number } }[];
  byProvider: {
    provider: string;
    status: string;
    _sum: { amount: number | null };
    _count: { _all: number };
  }[];
  revenue: { total: MoneyByCurrency[]; thisMonth: MoneyByCurrency[] };
  recent: PaymentRow[];
}

/** XOF/XAF are zero-decimal — the stored integer IS the amount. */
function formatMoney(amount: number, currency: string) {
  const zeroDecimal = currency === 'XOF' || currency === 'XAF';
  const value = zeroDecimal ? amount : amount / 100;
  return `${value.toLocaleString('en-US')} ${currency}`;
}

function sumLabel(rows: MoneyByCurrency[] | undefined) {
  if (!rows?.length) return '0';
  return rows.map((r) => formatMoney(r.amount, r.currency)).join(' + ');
}

/** KpiCard animates a number, so the headline tile shows XOF only. Other
 *  currencies stay visible in the caption line below the tiles. */
function xofOnly(rows: MoneyByCurrency[] | undefined): number | null {
  if (!rows) return null;
  return rows.find((r) => r.currency === 'XOF')?.amount ?? 0;
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api<PaymentsData>('/admin/payments'),
  });

  const completedCount =
    data?.revenue.total.reduce((n, r) => n + (r.count ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-gray-500">
          Collected revenue, subscriptions and recent transactions
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FadeIn delay={1}>
          <KpiCard
            label="Collected this month (XOF)"
            value={xofOnly(data?.revenue.thisMonth)}
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
            label="Completed payments"
            value={completedCount}
            Icon={CreditCard}
            tint="#EDE9FE"
            color="#8B5CF6"
          />
        </FadeIn>
      </div>

      <FadeIn delay={4}>
        <p className="text-xs text-gray-400">
          Amounts are provider-reported and summed per currency (never mixed).
          Lifetime collected: {sumLabel(data?.revenue.total)}.
        </p>
      </FadeIn>

      {(data?.byProvider ?? []).length > 0 && (
        <FadeIn delay={4} className="rounded-card border border-gray-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">By provider</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {data!.byProvider.map((r) => (
              <div
                key={`${r.provider}-${r.status}`}
                className="rounded-lg bg-gray-50 px-3 py-2"
              >
                <span className="font-medium capitalize">{r.provider}</span>
                <span className="ml-2 text-gray-400">{r.status}</span>
                <span className="ml-2 text-gray-500">
                  {r._count._all} · {(r._sum.amount ?? 0).toLocaleString('en-US')}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      <FadeIn delay={4} className="overflow-x-auto rounded-card border border-gray-100 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent ?? []).map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium">{p.user.profile?.displayName ?? '—'}</div>
                  <div className="text-xs text-gray-400">{p.user.email}</div>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge value={p.plan ?? p.sku ?? p.kind} />
                  {p.periodDays && (
                    <span className="ml-2 text-xs text-gray-400">{p.periodDays}d</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {formatMoney(p.amount, p.currency)}
                </td>
                <td className="px-5 py-3 capitalize text-gray-500">{p.provider}</td>
                <td className="px-5 py-3">
                  <StatusBadge value={p.status} />
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString()}
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
                  No payments yet — they appear here once checkout is live.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FadeIn>
    </div>
  );
}
