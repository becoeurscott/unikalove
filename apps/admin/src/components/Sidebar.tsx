'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  CreditCard,
  FileText,
  Flag,
  Heart,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Logo, LogoMark } from './Logo';

const NAV = [
  { href: '/', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/users', label: 'Users', Icon: Users },
  { href: '/matches', label: 'Matches', Icon: Heart },
  { href: '/conversations', label: 'Conversations', Icon: MessageCircle },
  { href: '/payments', label: 'Payments', Icon: CreditCard },
  { href: '/reports', label: 'Reports', Icon: Flag },
  { href: '/content', label: 'Content Management', Icon: FileText },
  { href: '/settings', label: 'App Settings', Icon: Settings },
  { href: '/notifications', label: 'Notifications', Icon: Bell },
  { href: '/support', label: 'Support', Icon: HelpCircle },
];

/**
 * The nav body, rendered twice: once in the desktop rail and once in the mobile
 * drawer. Both copies stay mounted, so the sliding active-pill needs a layoutId
 * per copy — a shared one would make framer-motion animate the pill between the
 * two and log a duplicate-id warning.
 */
function NavPanel({ variant }: { variant: 'rail' | 'drawer' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <div className="px-6 py-5">
        <Logo size={34} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'text-brand' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`nav-active-${variant}`}
                  className="absolute inset-0 rounded-lg bg-brand-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon size={18} className="relative z-10" strokeWidth={active ? 2.4 : 2} />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-card border border-gray-100 p-3">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Admin</div>
          <div className="truncate text-xs text-gray-400">{user?.role.replace('_', ' ')}</div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

  const current = NAV.find((n) => n.href === pathname);

  return (
    <>
      {/* Desktop: a permanent rail. */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        <NavPanel variant="rail" />
      </aside>

      {/* Mobile: a compact bar naming the current section. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-50"
        >
          <Menu size={20} />
        </button>
        <span className="flex-1 truncate text-sm font-semibold">
          {current?.label ?? 'Admin'}
        </span>
        <Link href="/" aria-label="Dashboard">
          <LogoMark size={26} />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="unika-drawer absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50"
            >
              <X size={18} />
            </button>
            <NavPanel variant="drawer" />
          </div>
        </div>
      )}
    </>
  );
}
