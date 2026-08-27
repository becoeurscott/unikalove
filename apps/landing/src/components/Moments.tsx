'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal } from './Reveal';

/**
 * Angled photo-shard collage like the identity poster: photos cut on the
 * diagonal with thin gold seams. Currently one source photo (different crops)
 * plus brand-gradient shards — more generated photos slot straight in.
 */
const SHARDS = [
  {
    clip: 'polygon(0 0, 100% 8%, 92% 100%, 0 92%)',
    img: '/couple-1.png',
    pos: 'left center',
  },
  {
    clip: 'polygon(8% 0, 100% 0, 100% 92%, 0 100%)',
    img: '/couple-1.png',
    pos: 'right center',
  },
  {
    clip: 'polygon(0 8%, 92% 0, 100% 100%, 8% 100%)',
    gradient: 'linear-gradient(135deg, #D6336C 0%, #8a1f45 100%)',
    label: '+2 400 matchs cette semaine',
  },
  {
    clip: 'polygon(0 0, 100% 8%, 92% 100%, 0 100%)',
    img: '/couple-1.png',
    pos: 'center 30%',
  },
  {
    clip: 'polygon(8% 0, 100% 0, 92% 100%, 0 92%)',
    gradient: 'linear-gradient(135deg, #E3B94E 0%, #A87B14 100%)',
    label: '54 pays connectés',
  },
];

export function Moments() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  return (
    <section ref={ref} className="overflow-hidden bg-brand-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Des moments <span className="text-brand">vrais</span>
          </h2>
          <p className="mt-3 text-gray-500">
            Derrière chaque match, une rencontre qui compte.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SHARDS.map((s, i) => (
            <Shard key={i} s={s} i={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Shard({
  s,
  i,
  progress,
}: {
  s: (typeof SHARDS)[number];
  i: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  // Alternate parallax direction per shard for the poster feel.
  const y = useTransform(progress, [0, 1], [i % 2 === 0 ? 40 : -40, i % 2 === 0 ? -40 : 40]);
  return (
    <motion.div style={{ y }} className="relative">
                {/* gold seam behind the shard */}
                <div
                  className="absolute inset-0 translate-x-1 translate-y-1 bg-brand-gold"
                  style={{ clipPath: s.clip }}
                />
                <div
                  className="relative flex h-56 items-end overflow-hidden sm:h-64"
                  style={{ clipPath: s.clip }}
                >
                  {s.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.img}
                      alt="Rencontre UnikaLove"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: s.pos }}
                    />
                  ) : (
                    <div className="absolute inset-0" style={{ background: s.gradient }} />
                  )}
                  {s.label && (
                    <span className="relative z-10 w-full p-4 text-center text-sm font-bold text-white">
                      {s.label}
                    </span>
                  )}
      </div>
    </motion.div>
  );
}
