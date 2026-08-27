'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Candidate, ProfileCard } from '@/components/ProfileCard';
import { api } from '@/lib/api';

export default function DiscoverPage() {
  const qc = useQueryClient();
  const [matched, setMatched] = useState<{ conversationId?: string } | null>(null);

  const { data: feed, isLoading } = useQuery({
    queryKey: ['discover-deck'],
    queryFn: () => api<Candidate[]>('/discovery/feed?limit=30'),
  });
  const [index, setIndex] = useState(0);

  const swipe = useMutation({
    mutationFn: (v: { targetId: string; type: string }) =>
      api<{ match: { conversation?: { id: string } } | null }>('/swipes', {
        method: 'POST',
        body: v,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['counts'] });
      if (res.match) {
        setMatched({ conversationId: res.match.conversation?.id });
        qc.invalidateQueries({ queryKey: ['matches'] });
      }
      setIndex((i) => i + 1);
    },
  });

  const current = feed?.[index];

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <h1 className="mb-6 text-2xl font-bold">Découvrir</h1>

      {isLoading && <p className="text-gray-400">Chargement…</p>}

      {!isLoading && current && (
        <ProfileCard
          candidate={current}
          busy={swipe.isPending}
          onSwipe={(type) => swipe.mutate({ targetId: current.userId, type })}
        />
      )}

      {!isLoading && !current && (
        <div className="text-center text-gray-400">
          <p>Vous avez tout vu pour aujourd&apos;hui !</p>
          <p className="text-sm">Revenez plus tard ou élargissez vos préférences.</p>
        </div>
      )}

      {current?.bio && (
        <p className="mt-4 max-w-sm text-center text-sm text-gray-500">{current.bio}</p>
      )}

      {matched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-card bg-white p-8 text-center">
            <PartyPopper className="mx-auto mb-3 text-brand" size={36} />
            <h2 className="text-xl font-bold text-brand">C&apos;est un match !</h2>
            <p className="mt-1 text-sm text-gray-500">Vous vous êtes aimés mutuellement.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setMatched(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium"
              >
                Continuer
              </button>
              <Link
                href={matched.conversationId ? `/messages/${matched.conversationId}` : '/messages'}
                className="flex-1 rounded-lg bg-brand py-2 text-center text-sm font-semibold text-white"
              >
                Envoyer un message
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
