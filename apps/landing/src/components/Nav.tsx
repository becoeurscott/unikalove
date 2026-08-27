'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Logo } from './Logo';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const LINKS = [
  { href: '#features', label: 'Pourquoi nous' },
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
];

export function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']);
  const shadow = useTransform(
    scrollY,
    [0, 120],
    ['0 0 0 rgba(0,0,0,0)', '0 8px 24px -16px rgba(0,0,0,0.25)'],
  );
  const height = useTransform(scrollY, [0, 120], ['5.5rem', '4rem']);
  // The hero is dark: wordmark stays white until the bar gains its own background.
  const inkColor = useTransform(scrollY, [0, 120], ['#FFFFFF', '#2B2B2B']);

  return (
    <motion.header
      style={{ backgroundColor: bg, boxShadow: shadow, height }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2">
          <Logo size={30} wordmark={false} />
          <motion.span style={{ color: inkColor }} className="text-lg font-bold">
            Unika<span className="text-brand">Love</span>
          </motion.span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <motion.a
              key={l.href}
              href={l.href}
              style={{ color: inkColor }}
              className="text-sm font-medium opacity-80 transition hover:opacity-100"
            >
              {l.label}
            </motion.a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <motion.a
            href={`${APP}/login`}
            style={{ color: inkColor }}
            className="hidden text-sm font-medium sm:block"
          >
            Se connecter
          </motion.a>
          <motion.a
            href={`${APP}/register`}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30"
          >
            S&apos;inscrire
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}
