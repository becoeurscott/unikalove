'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise. `delay` staggers in 0.06s units. */
export function FadeIn({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.06, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Wrap a list; children animate in one after another. */
const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={listVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/**
 * Cross-fades page content on navigation. Keyed on the pathname so each route
 * gets its own enter/exit pass.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Content swap that slides in the direction of travel (wizard steps). */
export function StepTransition({
  step,
  direction,
  children,
}: {
  step: number | string;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={step}
        custom={direction}
        initial={(d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 })}
        animate={{ opacity: 1, x: 0 }}
        exit={(d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 })}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
