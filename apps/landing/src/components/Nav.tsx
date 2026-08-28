'use client';

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  const [open, setOpen] = useState(false);

  // The panel only exists below md; widening the window must not strand it open.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      mq.removeEventListener('change', onChange);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

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
          {/*
            Without this the section links are simply unreachable on a phone —
            the desktop nav is hidden below md and nothing replaced it.
          */}
          <motion.button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            style={{ color: inkColor }}
            className="-mr-2 p-2 md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full border-t border-black/5 bg-white/95 backdrop-blur-md md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-6 py-2">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-black/5 py-3.5 text-sm font-medium text-brand-ink last:border-0"
                >
                  {l.label}
                </a>
              ))}
              {/* Hidden in the bar itself below sm, so it belongs in here too. */}
              <a
                href={`${APP}/login`}
                onClick={() => setOpen(false)}
                className="py-3.5 text-sm font-medium text-brand sm:hidden"
              >
                Se connecter
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
