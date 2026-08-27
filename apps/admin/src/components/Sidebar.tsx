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
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Logo } from './Logo';

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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
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
                  layoutId="nav-active"
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="m-3 flex items-center gap-3 rounded-card border border-gray-100 p-3"
      >
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
      </motion.div>
    </aside>
  );
}
