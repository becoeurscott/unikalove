'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, MessageCircle, UserX } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { GridSkeleton } from '@/components/Skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface MatchRow {
  id: string;
  matchedAt: string;
  conversation: { id: string } | null;
  userA: { id: string; profile: { displayName: string; verified: boolean } | null };
  userB: { id: string; profile: { displayName: string; verified: boolean } | null };
}

export default function MatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api<MatchRow[]>('/matches'),
  });

  const unmatch = useMutation({
    mutationFn: (id: string) => api(`/matches/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['counts'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vos matches</h1>
        <p className="text-sm text-gray-500">Les connexions mutuelles</p>
      </div>

      {isLoading && <GridSkeleton />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(matches ?? []).map((m) => {
          const other = m.userA.id === user?.id ? m.userB : m.userA;
          return (
            <div key={m.id} className="rounded-card border border-gray-100 bg-white p-4 text-center">
              <Link href={`/u/${other.id}`} className="block">
                <div className="mb-2 flex justify-center">
                  <Avatar name={other.profile?.displayName ?? '?'} size={64} />
                </div>
                <div className="flex items-center justify-center gap-1 text-sm font-semibold hover:text-brand">
                  {other.profile?.displayName}
                  {other.profile?.verified && <BadgeCheck size={14} className="text-sky-500" />}
                </div>
              </Link>
              <div className="text-xs text-gray-400">
                Match du {new Date(m.matchedAt).toLocaleDateString('fr')}
              </div>
              <div className="mt-3 flex justify-center gap-2">
                {m.conversation && (
                  <Link
                    href={`/messages/${m.conversation.id}`}
                    className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <MessageCircle size={13} /> Message
                  </Link>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Retirer le match avec ${other.profile?.displayName} ?`)) {
                      unmatch.mutate(m.id);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  <UserX size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {matches?.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-gray-400">
            Pas encore de match — la sélection du jour vous attend !
          </p>
        )}
      </div>
    </div>
  );
}
