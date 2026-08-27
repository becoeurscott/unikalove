'use client';

import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Reveal } from './Reveal';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-black py-28 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(214,51,108,0.25),transparent_65%)]" />
      <div className="relative z-10 mx-auto max-w-2xl px-6">
        <Reveal>
          <div className="mb-6 flex justify-center">
            <Logo size={72} onDark />
          </div>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Commencez votre histoire <span className="text-brand">aujourd&apos;hui</span>
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-4 text-white/70">
            Rejoignez des milliers de célibataires sincères, en Afrique et partout dans le monde.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <motion.a
            href={`${APP}/register`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 inline-block rounded-full bg-brand px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-brand/50"
          >
            S&apos;inscrire gratuitement
          </motion.a>
        </Reveal>
      </div>
      {/* pink wave + gold seam, like the identity poster footer */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,60 C360,10 1080,100 1440,40 L1440,90 L0,90 Z" fill="#C9A24B" opacity="0.9" />
        <path d="M0,70 C360,25 1080,105 1440,55 L1440,90 L0,90 Z" fill="#D6336C" />
      </svg>
    </section>
  );
}
