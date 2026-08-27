'use client';

import { motion } from 'framer-motion';

/** Fade + slide-up entrance, staggered by `delay` (in units of 0.07s). */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -3, boxShadow: '0 12px 24px -12px rgba(214,51,108,0.25)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

/** Animated count-up number. */
export function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Ticker value={value} prefix={prefix} />
    </motion.span>
  );
}

import { animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

function Ticker({ value, prefix }: { value: number; prefix: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString());
  const [text, setText] = useState(prefix + '0');

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setText(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, rounded]);

  return <span>{text}</span>;
}
