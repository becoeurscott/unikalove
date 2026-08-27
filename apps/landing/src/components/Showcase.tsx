'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { BadgeCheck, Heart, MessageCircle } from 'lucide-react';
import { useRef } from 'react';
import { Reveal } from './Reveal';

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [120, -40]);
  const rotate = useTransform(scrollYProgress, [0, 1], [4, -4]);

  return (
    <section ref={ref} className="overflow-hidden py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <Reveal>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Des rencontres <span className="text-brand">de qualité</span>,
              <br /> pas des swipes sans fin
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-4 max-w-md text-gray-600">
              UnikaLove privilégie les connexions qui comptent : une sélection quotidienne
              restreinte, un score de compatibilité IA et des conversations qui démarrent
              vraiment.
            </p>
          </Reveal>
          <div className="mt-8 space-y-4">
            <motion.div
              style={{ y: y1 }}
              className="flex w-72 items-center gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-brand/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Heart size={18} />
              </span>
              <div>
                <div className="text-sm font-bold">Nouveau match ! 🎉</div>
                <div className="text-xs text-gray-500">Aïcha et vous vous êtes aimés</div>
              </div>
            </motion.div>
            <motion.div
              style={{ y: y2 }}
              className="ml-10 flex w-72 items-center gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-brand/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <MessageCircle size={18} />
              </span>
              <div>
                <div className="text-sm font-bold">
                  Kofi <BadgeCheck size={13} className="inline text-sky-500" />
                </div>
                <div className="text-xs text-gray-500">« Team thé ou café ? ☕ »</div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div style={{ rotate }} className="relative mx-auto">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand to-brand-gold opacity-20 blur-2xl" />
          <div className="overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl">
            <video
              className="h-[420px] w-[300px] object-cover motion-reduce:hidden"
              src="/loop.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
