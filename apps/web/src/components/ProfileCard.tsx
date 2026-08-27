'use client';

import { BadgeCheck, Heart, MapPin, Star, X } from 'lucide-react';
import { Avatar } from './Avatar';

export interface Candidate {
  id: string;
  userId: string;
  displayName: string;
  city: string | null;
  verified: boolean;
  bio: string | null;
  intent: string | null;
  photo: string | null;
  interests: string[];
  age: number;
  distanceKm: number | null;
}

export function ProfileCard({
  candidate,
  onSwipe,
  busy,
}: {
  candidate: Candidate;
  onSwipe: (type: 'PASS' | 'FAVORITE' | 'LIKE') => void;
  busy?: boolean;
}) {
  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-card border border-gray-100 bg-white shadow-sm">
      <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-brand-soft to-brand-cream">
        <Avatar name={candidate.displayName} photo={candidate.photo} size={112} />
        {candidate.distanceKm != null && (
          <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-medium text-gray-600">
            à {candidate.distanceKm} km
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 font-semibold">
          {candidate.displayName}, {candidate.age}
          {candidate.verified && <BadgeCheck size={16} className="text-sky-500" />}
        </div>
        {candidate.city && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} /> {candidate.city}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.interests.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-around border-t border-gray-50 pt-3">
          <button
            disabled={busy}
            onClick={() => onSwipe('PASS')}
            aria-label="Passer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={18} />
          </button>
          <button
            disabled={busy}
            onClick={() => onSwipe('FAVORITE')}
            aria-label="Ajouter aux favoris"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 text-amber-500 transition hover:bg-amber-50 disabled:opacity-50"
          >
            <Star size={18} />
          </button>
          <button
            disabled={busy}
            onClick={() => onSwipe('LIKE')}
            aria-label="Aimer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Heart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
