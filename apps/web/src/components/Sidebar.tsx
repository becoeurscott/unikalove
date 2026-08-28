'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  Compass,
  Crown,
  Heart,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Settings,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { isSoundEnabled, playSound, setSoundEnabled } from '@/lib/sound';
import { Logo } from './Logo';

interface Counts {
  likesReceived: number;
  matches: number;
  unreadMessages: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [upgradeError, setUpgradeError] = useState('');

  /**
   * Plan, duration and payment method are chosen on /premium — checkout can no
   * longer be a single blind POST now that Mobile Money needs a period and a
   * phone number.
   */
  function upgrade() {
    setUpgradeError('');
    router.push('/premium');
  }
  const { data: counts } = useQuery({
    queryKey: ['counts'],
    queryFn: () => api<Counts>('/matching/counts'),
    refetchInterval: 30_000,
  });

  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => setSoundOn(isSoundEnabled()), []);

  /**
   * The badges are the app's notification surface, so a rise in any of them
   * plays a cue. The first poll only seeds the baseline — otherwise every page
   * load would announce counts the user has already seen.
   */
  const previous = useRef<Counts | null>(null);
  useEffect(() => {
    if (!counts) return;
    const before = previous.current;
    previous.current = counts;
    if (!before) return;
    if (counts.unreadMessages > before.unreadMessages) playSound('message');
    else if (counts.matches > before.matches) playSound('match');
    else if (counts.likesReceived > before.likesReceived) playSound('notify');
  }, [counts]);

  const NAV = [
    { href: '/', label: 'Tableau de bord', Icon: LayoutGrid },
    { href: '/discover', label: 'Découvrir', Icon: Compass },
    { href: '/likes', label: 'Likes', Icon: Heart, badge: counts?.likesReceived },
    { href: '/matches', label: 'Matches', Icon: Users, badge: counts?.matches },
    { href: '/messages', label: 'Messages', Icon: MessageCircle, badge: counts?.unreadMessages },
    { href: '/bookmarks', label: 'Favoris', Icon: Bookmark },
    { href: '/coach', label: 'Coach IA', Icon: Sparkles, premium: true },
    { href: '/profile', label: 'Profil', Icon: User },
    { href: '/settings', label: 'Réglages', Icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
      <Link href="/" className="px-6 py-5">
        <Logo size={34} />
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ href, label, Icon, badge, premium }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-brand-soft text-brand' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                {label}
              </span>
              {!!badge && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
              {premium && user?.plan === 'FREE' && (
                <Crown size={13} className="text-brand-gold" aria-label="Premium" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => {
            const next = !soundOn;
            setSoundEnabled(next);
            setSoundOn(next);
            if (next) playSound('notify');
          }}
          aria-pressed={soundOn}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {soundOn ? 'Sons activés' : 'Sons coupés'}
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </nav>
      {user?.plan === 'FREE' && (
        <div className="m-3 rounded-card bg-brand-soft p-4 text-center">
          <Crown className="mx-auto mb-1 text-brand-gold" size={22} />
          <div className="text-sm font-bold text-brand">Passez Premium</div>
          <p className="mb-2 text-xs text-gray-600">
            Likes illimités et voyez qui vous aime.
          </p>
          <button
            onClick={upgrade}
            className="w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-white"
          >
            Mettre à niveau
          </button>
          {upgradeError && (
            <p className="mt-1.5 text-[11px] text-gray-500">{upgradeError}</p>
          )}
        </div>
      )}
    </aside>
  );
}
