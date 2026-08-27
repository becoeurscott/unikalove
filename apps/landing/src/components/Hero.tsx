'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Mail } from 'lucide-react';
import { Logo } from './Logo';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const WORDS = ["L'amour", "n'a", 'pas', 'de', 'frontières'];

const OAUTH = [
  { label: 'Continuer avec Google', classes: 'bg-white text-gray-700' },
  { label: 'Continuer avec Facebook', classes: 'bg-[#1877F2] text-white' },
  { label: 'Continuer avec Apple', classes: 'bg-black text-white ring-1 ring-white/20' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60 motion-reduce:hidden"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-32 lg:grid-cols-2 lg:items-center">
        <div>
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Logo size={64} onDark />
          </motion.div>
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {WORDS.map((w, i) => (
              <motion.span
                key={i}
                className={`mr-3 inline-block ${i >= 1 ? 'text-brand' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-5 max-w-md text-lg text-white/80"
          >
            Rencontrez des personnes sincères et construisez une histoire vraie. Le dating repensé
            pour l&apos;Afrique et sa diaspora, propulsé par l&apos;IA.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-sm rounded-3xl bg-white/95 p-7 shadow-2xl backdrop-blur"
        >
          <h2 className="text-center text-lg font-bold text-brand">Commencez votre histoire</h2>
          <p className="mb-5 text-center text-sm text-gray-500">Inscrivez-vous gratuitement</p>
          <div className="space-y-2.5">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`${APP}/register`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30"
            >
              <Mail size={16} /> S&apos;inscrire avec e-mail
            </motion.a>
            {OAUTH.map((o) => (
              <a
                key={o.label}
                href={`${APP}/register`}
                className={`flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium shadow ${o.classes}`}
              >
                {o.label}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <a href={`${APP}/login`} className="font-semibold text-brand">
              Se connecter
            </a>
          </p>
        </motion.div>
      </div>

      <motion.a
        href="#features"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Défiler"
      >
        <ChevronDown size={28} />
      </motion.a>
    </section>
  );
}
