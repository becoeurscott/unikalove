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
  Menu,
  Settings,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { isSoundEnabled, playSound, setSoundEnabled } from '@/lib/sound';
import { Logo, LogoMark } from './Logo';

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
  const [open, setOpen] = useState(false);

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

  // Navigating always closes the drawer; otherwise it stays over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // While the drawer is over the page, the page behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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

  /** Any unseen activity at all — the dot on the closed mobile menu button. */
  const hasActivity = Boolean(
    (counts?.unreadMessages ?? 0) + (counts?.likesReceived ?? 0) + (counts?.matches ?? 0),
  );

  const panel = (
    <>
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
          <p className="mb-2 text-xs text-gray-600">Likes illimités et voyez qui vous aime.</p>
          <button
            onClick={upgrade}
            className="w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-white"
          >
            Mettre à niveau
          </button>
          {upgradeError && <p className="mt-1.5 text-[11px] text-gray-500">{upgradeError}</p>}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: a permanent rail. */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        {panel}
      </aside>

      {/* Mobile: a compact bar; the same panel slides in over the page. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-50"
        >
          <Menu size={20} />
          {hasActivity && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
          )}
        </button>
        <Link href="/" aria-label="Accueil">
          <LogoMark size={26} />
        </Link>
        <Link
          href="/messages"
          aria-label="Messages"
          className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-50"
        >
          <MessageCircle size={20} />
          {!!counts?.unreadMessages && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
              {counts.unreadMessages}
            </span>
          )}
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="unika-drawer absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50"
            >
              <X size={18} />
            </button>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
