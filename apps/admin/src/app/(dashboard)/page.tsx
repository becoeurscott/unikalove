'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Calendar,
  DollarSign,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { Donut, GrowthChart } from '@/components/Charts';
import { KpiCard } from '@/components/KpiCard';
import { FadeIn } from '@/components/Motion';
import { api } from '@/lib/api';

interface Kpis {
  totals: { users: number; matches: number; conversations: number; revenue: number };
  lastWeek: { newUsers: number; newMatches: number };
  userGrowth: { day: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  matchesOverview: { status: string; count: number }[];
}

const ACTIVITY_META: Record<string, { Icon: typeof Users; color: string; bg: string }> = {
  user_registered: { Icon: UserPlus, color: '#D6336C', bg: '#FDECF2' },
  match_created: { Icon: Heart, color: '#F59E0B', bg: '#FEF3C7' },
  message: { Icon: MessageCircle, color: '#8B5CF6', bg: '#EDE9FE' },
  verification: { Icon: BadgeCheck, color: '#10B981', bg: '#D1FAE5' },
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const { data: kpis } = useQuery({ queryKey: ['kpis'], queryFn: () => api<Kpis>('/admin/kpis') });
  const { data: topUsers } = useQuery({
    queryKey: ['top-users'],
    queryFn: () =>
      api<{ id: string; displayName: string; city: string; matches: number }[]>('/admin/top-users'),
  });
  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api<{ type: string; label: string; at: string }[]>('/admin/activity'),
  });

  const growth =
    kpis?.userGrowth.map((g) => ({
      day: new Date(g.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: g.count,
    })) ?? [];

  const matchDonut =
    kpis?.matchesOverview.map((m) => ({
      name: m.status === 'ACTIVE' ? 'Active' : m.status === 'UNMATCHED' ? 'Unmatched' : 'Expired',
      value: m.count,
      color: m.status === 'ACTIVE' ? '#D6336C' : m.status === 'UNMATCHED' ? '#8B5CF6' : '#F59E0B',
    })) ?? [];
  const totalMatches = kpis?.totals.matches ?? 0;

  const genderDonut =
    kpis?.genderDistribution.map((g) => ({
      name: g.gender === 'FEMALE' ? 'Female' : g.gender === 'MALE' ? 'Male' : 'Other',
      value: g.count,
      color: g.gender === 'FEMALE' ? '#D6336C' : g.gender === 'MALE' ? '#8B5CF6' : '#F59E0B',
    })) ?? [];

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your app.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          <Calendar size={16} />
          {new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FadeIn delay={1}>
          <KpiCard
            label="Total Users"
            value={kpis?.totals.users ?? null}
            delta={kpis ? `+${kpis.lastWeek.newUsers}` : undefined}
            Icon={Users}
            tint="#FDECF2"
            color="#D6336C"
          />
        </FadeIn>
        <FadeIn delay={2}>
          <KpiCard
            label="Total Matches"
            value={kpis?.totals.matches ?? null}
            delta={kpis ? `+${kpis.lastWeek.newMatches}` : undefined}
            Icon={Heart}
            tint="#FEF3C7"
            color="#F59E0B"
          />
        </FadeIn>
        <FadeIn delay={3}>
          <KpiCard
            label="Conversations"
            value={kpis?.totals.conversations ?? null}
            Icon={MessageCircle}
            tint="#EDE9FE"
            color="#8B5CF6"
          />
        </FadeIn>
        <FadeIn delay={4}>
          <KpiCard
            label="Revenue"
            value={kpis?.totals.revenue ?? 0}
            prefix="$"
            Icon={DollarSign}
            tint="#D1FAE5"
            color="#10B981"
          />
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FadeIn delay={5}>
            <section className="rounded-card border border-gray-100 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">User Growth</h2>
                <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500">
                  Last 7 Days
                </span>
              </div>
              <GrowthChart data={growth} />
            </section>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FadeIn delay={6}>
              <section className="rounded-card border border-gray-100 bg-white p-6">
                <h2 className="mb-2 font-semibold">Matches Overview</h2>
                <Donut data={matchDonut} centerValue={String(totalMatches)} centerLabel="Total Matches" />
                <ul className="mt-2 space-y-1 text-sm">
                  {matchDonut.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} — {d.value}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
            <FadeIn delay={7}>
              <section className="rounded-card border border-gray-100 bg-white p-6">
                <h2 className="mb-2 font-semibold">Gender Distribution</h2>
                <Donut data={genderDonut} />
                <ul className="mt-2 space-y-1 text-sm">
                  {genderDonut.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} — {d.value}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          </div>
        </div>

        <div className="space-y-6">
          <FadeIn delay={6}>
            <section className="rounded-card border border-gray-100 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Top Active Users</h2>
                <span className="text-xs font-medium text-brand">View All</span>
              </div>
              <ul className="space-y-3">
                {(topUsers ?? []).map((u) => (
                  <li key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                        {u.displayName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.displayName}</div>
                        <div className="text-xs text-gray-400">{u.city}</div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-brand">{u.matches} Matches</span>
                  </li>
                ))}
                {topUsers?.length === 0 && <li className="text-sm text-gray-400">No matches yet</li>}
              </ul>
            </section>
          </FadeIn>

          <FadeIn delay={7}>
            <section className="rounded-card border border-gray-100 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Recent Activity</h2>
                <span className="text-xs font-medium text-brand">View All</span>
              </div>
              <ul className="space-y-3">
                {(activity ?? []).map((a, i) => {
                  const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.message;
                  return (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: meta.bg, color: meta.color }}
                        >
                          <meta.Icon size={15} />
                        </span>
                        <span className="text-sm">{a.label}</span>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{timeAgo(a.at)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
