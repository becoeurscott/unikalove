'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LogoMark } from './Logo';

/**
 * Full-screen wait for an action the user just started.
 *
 * The API sleeps after ~15 minutes idle on its current plan, so the first
 * request of a session can take the best part of a minute while the container
 * wakes. A spinner alone reads as "broken" at that length, so the copy changes
 * as the wait grows: reassurance first, then an honest explanation, rather than
 * pretending everything is instant.
 */
const STAGES = [
  { after: 0, text: null },
  { after: 4_000, text: 'Le serveur se réveille…' },
  { after: 12_000, text: 'Encore quelques secondes, presque prêt.' },
  { after: 30_000, text: "Cela prend plus longtemps que d'habitude — merci de patienter." },
];

export function LoadingOverlay({ show, title }: { show: boolean; title: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!show) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - started), 500);
    return () => clearInterval(id);
  }, [show]);

  const stage = [...STAGES].reverse().find((s) => elapsed >= s.after);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-brand-cream/95 backdrop-blur-sm"
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            {/* Two offset rings, so the wait reads as a heartbeat rather than a spinner. */}
            {[0, 0.6].map((delay) => (
              <motion.span
                key={delay}
                className="absolute inset-0 rounded-full bg-brand/20"
                animate={{ scale: [0.7, 1.25], opacity: [0.55, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay }}
              />
            ))}
            <motion.div
              animate={{ scale: [1, 1.09, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <LogoMark size={64} />
            </motion.div>
          </div>

          <div className="px-6 text-center">
            <p className="text-base font-semibold text-brand-ink">{title}</p>
            <div className="mt-1.5 h-5">
              <AnimatePresence mode="wait">
                {stage?.text && (
                  <motion.p
                    key={stage.text}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm text-gray-500"
                  >
                    {stage.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* An indeterminate sweep: honest about not knowing how long is left. */}
          <div className="h-1 w-48 overflow-hidden rounded-full bg-brand/10">
            <motion.div
              className="h-full w-1/3 rounded-full bg-brand"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
