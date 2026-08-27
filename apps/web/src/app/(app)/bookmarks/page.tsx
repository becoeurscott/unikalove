'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { GridSkeleton } from '@/components/Skeleton';
import { api } from '@/lib/api';

interface FavoriteRow {
  id: string;
  createdAt: string;
  target: {
    id: string;
    profile: {
      displayName: string;
      city: string | null;
      verified: boolean;
      photos: { url: string }[];
    } | null;
  };
}

export default function BookmarksPage() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api<FavoriteRow[]>('/swipes/favorites'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favoris</h1>
        <p className="text-sm text-gray-500">Les profils que vous avez mis de côté</p>
      </div>

      {isLoading && <GridSkeleton />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(favorites ?? []).map((f) => (
          <div key={f.id} className="rounded-card border border-gray-100 bg-white p-4 text-center">
            <div className="mb-2 flex justify-center">
              <Avatar
                name={f.target.profile?.displayName ?? '?'}
                photo={f.target.profile?.photos?.[0]?.url}
                size={64}
              />
            </div>
            <div className="flex items-center justify-center gap-1 text-sm font-semibold">
              {f.target.profile?.displayName}
              {f.target.profile?.verified && <BadgeCheck size={14} className="text-sky-500" />}
            </div>
            <div className="text-xs text-gray-400">{f.target.profile?.city}</div>
          </div>
        ))}
        {favorites?.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-gray-400">
            Aucun favori — utilisez l&apos;étoile ★ sur un profil pour le garder ici.
          </p>
        )}
      </div>
    </div>
  );
}
