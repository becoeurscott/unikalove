'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Lock, Rocket, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { CompletenessRing } from '@/components/CompletenessRing';
import { Candidate, ProfileCard } from '@/components/ProfileCard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface MyProfile {
  displayName: string;
  completeness: number;
}

interface MatchRow {
  id: string;
  userAId: string;
  conversation: { id: string } | null;
  userA: { id: string; profile: { displayName: string } | null };
  userB: { id: string; profile: { displayName: string } | null };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api<MyProfile>('/profiles/me'),
  });
  const { data: feed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api<Candidate[]>('/discovery/feed?limit=8'),
  });
  const { data: picks } = useQuery({
    queryKey: ['daily-picks'],
    queryFn: () => api<Candidate[]>('/discovery/daily-picks'),
  });
  const { data: matches } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api<MatchRow[]>('/matches'),
  });
  const { data: counts } = useQuery({
    queryKey: ['counts'],
    queryFn: () => api<{ likesReceived: number }>('/matching/counts'),
  });

  const swipe = useMutation({
    mutationFn: (v: { targetId: string; type: string }) =>
      api<{ match: unknown }>('/swipes', { method: 'POST', body: v }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['daily-picks'] });
      qc.invalidateQueries({ queryKey: ['counts'] });
      if (res.match) qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="space-y-6 xl:col-span-3">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {me?.displayName ?? '…'} 👋
          </h1>
          <p className="text-sm text-gray-500">Prêt(e) pour de belles rencontres ?</p>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Découvrir</h2>
            <Link href="/discover" className="text-sm font-medium text-brand">
              Voir tout
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {(feed ?? []).map((c) => (
              <ProfileCard
                key={c.id}
                candidate={c}
                busy={swipe.isPending}
                onSwipe={(type) => swipe.mutate({ targetId: c.userId, type })}
              />
            ))}
            {feed?.length === 0 && (
              <p className="py-10 text-sm text-gray-400">
                Plus de profils pour le moment — élargissez vos préférences dans les réglages.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Sélection du jour</h2>
            <span className="text-xs text-gray-400">Mise à jour quotidienne</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(picks ?? []).map((c) => (
              <div
                key={c.id}
                className="flex w-56 shrink-0 items-center gap-3 rounded-card border border-gray-100 bg-white p-3"
              >
                <Avatar name={c.displayName} photo={c.photo} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {c.displayName}, {c.age}
                  </div>
                  <div className="truncate text-xs text-gray-400">{c.city}</div>
                </div>
                <button
                  onClick={() => swipe.mutate({ targetId: c.userId, type: 'LIKE' })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
                  aria-label="Aimer"
                >
                  <Heart size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between rounded-card bg-brand-soft p-5">
          <div className="flex items-center gap-3">
            <Rocket className="text-brand" size={22} />
            <div>
              <div className="font-semibold">Soyez vu(e) par plus de monde</div>
              <p className="text-sm text-gray-600">
                Boostez votre profil et multipliez vos chances de match.
              </p>
            </div>
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
            Booster mon profil
          </button>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-card border border-gray-100 bg-white p-5 text-center">
          <h3 className="mb-3 text-sm font-semibold">Profil complété</h3>
          <div className="flex justify-center">
            <CompletenessRing value={me?.completeness ?? 0} />
          </div>
          <Link
            href="/profile"
            className="mt-3 inline-block rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white"
          >
            Compléter mon profil
          </Link>
        </section>

        <section className="rounded-card border border-gray-100 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Qui vous a aimé</h3>
            <span className="text-xs font-medium text-brand">{counts?.likesReceived ?? 0} likes</span>
          </div>
          <div className="relative mb-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gradient-to-br from-brand-soft to-gray-100 blur-[2px]" />
            ))}
            {user?.plan === 'FREE' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="text-brand" size={18} />
              </div>
            )}
          </div>
          <Link href="/likes" className="text-xs font-semibold text-brand">
            Voir tous les likes →
          </Link>
        </section>

        <section className="rounded-card border border-gray-100 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold">Vos matches</h3>
          <ul className="space-y-2.5">
            {(matches ?? []).slice(0, 5).map((m) => {
              const other = m.userA.id === user?.id ? m.userB : m.userA;
              return (
                <li key={m.id}>
                  <Link
                    href={m.conversation ? `/messages/${m.conversation.id}` : '/matches'}
                    className="flex items-center gap-3 rounded-lg p-1 hover:bg-gray-50"
                  >
                    <Avatar name={other.profile?.displayName ?? '?'} size={32} />
                    <span className="text-sm font-medium">{other.profile?.displayName}</span>
                  </Link>
                </li>
              );
            })}
            {matches?.length === 0 && (
              <li className="text-xs text-gray-400">Pas encore de match — continuez à découvrir !</li>
            )}
          </ul>
        </section>

        <section className="rounded-card border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand" size={18} />
            <h3 className="text-sm font-semibold">Conseils de sécurité</h3>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Votre sécurité est notre priorité. Ne partagez jamais vos informations financières et
            signalez tout comportement suspect.
          </p>
        </section>
      </aside>
    </div>
  );
}
