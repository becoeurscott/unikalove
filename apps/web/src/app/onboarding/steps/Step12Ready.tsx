'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { api } from '@/lib/api';

interface Pick {
  id: string;
  displayName: string;
  city: string | null;
  age: number;
  photo: string | null;
}

/** Screen 12 — the payoff: real people, fetched live. */
export function Step12Ready({ onEnter }: { onEnter: () => void }) {
  const { data: picks, isLoading } = useQuery({
    queryKey: ['daily-picks'],
    queryFn: () => api<Pick[]>('/discovery/daily-picks'),
    retry: false,
  });

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft"
      >
        <Sparkles className="text-brand" size={28} />
      </motion.div>

      <h1 className="text-2xl font-bold">Vos profils vous attendent</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
        Votre profil est prêt. Voici quelques personnes sélectionnées pour vous.
      </p>

      <div className="mt-7 flex justify-center gap-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="unika-shimmer h-24 w-20 rounded-xl" />
          ))}
        {(picks ?? []).slice(0, 3).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: i === 0 ? -4 : i === 2 ? 4 : 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-soft to-brand-cream">
              <Avatar name={p.displayName} photo={p.photo} size={44} />
            </div>
            <div className="px-1.5 py-1.5">
              <div className="truncate text-[11px] font-semibold">{p.displayName}</div>
              <div className="truncate text-[10px] text-gray-400">{p.city}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {picks?.length === 0 && (
        <p className="mt-6 text-sm text-gray-400">
          Aucun profil ne correspond encore à vos critères — élargissez la distance
          dans les réglages.
        </p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onEnter}
        className="mt-9 inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 font-semibold text-white shadow-lg shadow-brand/25"
      >
        Commencer <ArrowRight size={17} />
      </motion.button>
    </div>
  );
}
