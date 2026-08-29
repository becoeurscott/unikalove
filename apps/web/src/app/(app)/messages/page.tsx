'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { PresenceDot } from '@/components/PresenceDot';
import { ListSkeleton } from '@/components/Skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ConversationRow {
  id: string;
  match: {
    userA: { id: string; profile: { displayName: string; photos: { url: string }[] } | null };
    userB: { id: string; profile: { displayName: string; photos: { url: string }[] } | null };
  };
  messages: { content: string; senderId: string; createdAt: string; readAt: string | null }[];
  /** Served with the row so the badge is right before any socket event lands. */
  otherUserId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<ConversationRow[]>('/conversations'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-gray-500">Vos conversations</p>
      </div>

      {isLoading && <ListSkeleton />}

      <div className="divide-y divide-gray-50 rounded-card border border-gray-100 bg-white">
        {(conversations ?? []).map((c) => {
          const other = c.match.userA.id === user?.id ? c.match.userB : c.match.userA;
          const last = c.messages[0];
          const unread = last && last.senderId !== user?.id && !last.readAt;
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 p-4 transition hover:bg-gray-50"
            >
              <span className="relative shrink-0">
                <Avatar
                  name={other.profile?.displayName ?? '?'}
                  photo={other.profile?.photos?.[0]?.url}
                  size={44}
                />
                <PresenceDot
                  userId={other.id}
                  fallback={{ online: c.online, lastSeenAt: c.lastSeenAt }}
                  overlay
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${unread ? 'font-bold' : 'font-semibold'}`}>
                    {other.profile?.displayName}
                  </span>
                  {last && (
                    <span className="text-xs text-gray-400">
                      {new Date(last.createdAt).toLocaleDateString('fr')}
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-sm ${unread ? 'font-semibold text-brand-ink' : 'text-gray-500'}`}
                >
                  {last?.content ?? 'Dites bonjour 👋'}
                </p>
              </div>
              {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
            </Link>
          );
        })}
        {conversations?.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">
            Pas encore de conversation — matchez pour discuter !
          </p>
        )}
      </div>
    </div>
  );
}
