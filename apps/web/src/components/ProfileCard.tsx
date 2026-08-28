'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Heart, MapPin, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar } from './Avatar';
import { Spinner } from './Spinner';

type SwipeKind = 'PASS' | 'FAVORITE' | 'LIKE';

/** Where the card flies when each action is taken. */
const EXIT: Record<SwipeKind, { x: number; y: number; rotate: number }> = {
  PASS: { x: -420, y: 0, rotate: -18 },
  FAVORITE: { x: 0, y: -420, rotate: 0 },
  LIKE: { x: 420, y: 0, rotate: 18 },
};

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
  onSwipe: (type: SwipeKind) => void;
  busy?: boolean;
}) {
  // Track the chosen action so the card can exit toward it before unmounting.
  const [leaving, setLeaving] = useState<SwipeKind | null>(null);

  // The parent reuses this component for the next candidate, so the exit flag
  // has to clear on its own — otherwise the deck goes blank after one swipe.
  useEffect(() => setLeaving(null), [candidate.userId]);

  function handle(type: SwipeKind) {
    if (busy || leaving) return;
    setLeaving(type);
    // Let the exit animation play, then tell the parent.
    setTimeout(() => onSwipe(type), 180);
  }

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            ...(leaving ? EXIT[leaving] : {}),
            transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          className="w-52 shrink-0 overflow-hidden rounded-card border border-gray-100 bg-white shadow-sm">
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-brand-soft to-brand-cream">
        <Avatar name={candidate.displayName} photo={candidate.photo} size={84} />
        {candidate.distanceKm != null && (
          <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-medium text-gray-600">
            à {candidate.distanceKm} km
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
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
        <div className="mt-3 flex items-center justify-around border-t border-gray-50 pt-2.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={busy}
            onClick={() => handle('PASS')}
            aria-label="Passer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={busy}
            onClick={() => handle('FAVORITE')}
            aria-label="Ajouter aux favoris"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-amber-500 transition hover:bg-amber-50 disabled:opacity-50"
          >
            <Star size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={busy}
            onClick={() => handle('LIKE')}
            aria-label="Aimer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Spinner size={16} /> : <Heart size={16} />}
          </motion.button>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
