'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Crown } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { api, ApiError } from '@/lib/api';

interface LikeRow {
  id: string;
  type: string;
  createdAt: string;
  actor: {
    id: string;
    profile: { displayName: string; city: string | null; verified: boolean } | null;
  };
}

export default function LikesPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['likes-received'],
    queryFn: () => api<LikeRow[]>('/likes/received'),
    retry: false,
  });

  const premiumRequired = error instanceof ApiError && error.status === 403;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Likes reçus</h1>
        <p className="text-sm text-gray-500">Les personnes qui vous ont aimé(e)</p>
      </div>

      {premiumRequired && (
        <div className="mx-auto max-w-md rounded-card border border-gray-100 bg-white p-8 text-center">
          <div className="mb-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gradient-to-br from-brand-soft to-gray-100 blur-[3px]"
              />
            ))}
          </div>
          <Crown className="mx-auto mb-2 text-brand-gold" size={28} />
          <h2 className="font-bold">Fonctionnalité Premium</h2>
          <p className="mt-1 text-sm text-gray-500">
            Passez Premium pour voir qui vous a aimé(e) et matcher instantanément.
          </p>
          <button className="mt-4 rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white">
            Passer Premium
          </button>
        </div>
      )}

      {isLoading && <p className="text-gray-400">Chargement…</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((like) => (
            <div
              key={like.id}
              className="rounded-card border border-gray-100 bg-white p-4 text-center"
            >
              <div className="mb-2 flex justify-center">
                <Avatar name={like.actor.profile?.displayName ?? '?'} size={64} />
              </div>
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                {like.actor.profile?.displayName}
                {like.actor.profile?.verified && (
                  <BadgeCheck size={14} className="text-sky-500" />
                )}
              </div>
              <div className="text-xs text-gray-400">{like.actor.profile?.city}</div>
              <div className="mt-1 text-xs text-brand">
                {like.type === 'SUPERLIKE' ? 'Super like ⭐' : 'Like ❤️'}
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-gray-400">
              Pas encore de likes — complétez votre profil pour être plus visible !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
