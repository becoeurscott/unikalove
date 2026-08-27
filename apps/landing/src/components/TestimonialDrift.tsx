'use client';

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { BadgeCheck, Quote } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface Voice {
  quote: string;
  name: string;
  role: string;
  city: string;
  tint: string;
  verified?: boolean;
  /** Optional portrait; falls back to coloured initials. */
  photo?: string;
}

const CARD_W = 320;
const GAP = 20;
const PITCH = CARD_W + GAP;
/** Longest quotes are clamped so a card never outgrows its fixed height. */
const QUOTE_LINES = 6;

const mod = (v: number, size: number) => (size <= 0 ? 0 : ((v % size) + size) % size);
/** Wrap a value into [-span/2, span/2) so rows loop seamlessly. */
const fold = (v: number, span: number) => (span <= 0 ? v : mod(v + span / 2, span) - span / 2);

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '—'
  );
}

/** Relative luminance → pick legible ink per card colour. */
function isDark(hex: string) {
  const s = hex.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  if (Number.isNaN(n)) return false;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const chan = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b) < 0.42;
}

function Card({ voice }: { voice: Voice }) {
  const dark = isDark(voice.tint);
  const ink = dark ? 'rgba(255,255,255,0.95)' : 'rgba(12,14,18,0.94)';
  const muted = dark ? 'rgba(255,255,255,0.6)' : 'rgba(12,14,18,0.5)';
  const hair = dark ? 'rgba(255,255,255,0.14)' : 'rgba(12,14,18,0.07)';

  return (
    <figure
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl p-5 sm:p-7"
      style={{
        background: voice.tint,
        boxShadow: `inset 0 0 0 1px ${hair}, 0 18px 40px -24px rgba(12,14,18,0.35)`,
      }}
    >
      <Quote size={20} style={{ color: muted }} className="mb-3 shrink-0" />
      <blockquote
        className="min-h-0 flex-1 overflow-hidden text-[15px] font-medium leading-relaxed"
        style={{
          color: ink,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: QUOTE_LINES,
        }}
      >
        « {voice.quote} »
      </blockquote>
      <figcaption
        className="mt-4 flex min-w-0 shrink-0 items-center gap-3 border-t pt-4"
        style={{ borderColor: hair }}
      >
        {voice.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voice.photo}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${hair}` }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              background: dark ? 'rgba(255,255,255,0.16)' : 'rgba(12,14,18,0.08)',
              color: ink,
            }}
          >
            {initials(voice.name)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-bold" style={{ color: ink }}>
            <span className="truncate">{voice.name}</span>
            {voice.verified && <BadgeCheck size={14} className="shrink-0 text-sky-500" />}
          </div>
          <div className="truncate text-xs" style={{ color: muted }}>
            {voice.role} · {voice.city}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

interface Drive {
  pace: number;
  target: number;
  boost: number;
  dragging: boolean;
  pointer: number;
  origin: number;
  lastX: number;
  lastTime: number;
  speed: number;
}

const freshDrive = (): Drive => ({
  pace: 1,
  target: 1,
  boost: 0,
  dragging: false,
  pointer: 0,
  origin: 0,
  lastX: 0,
  lastTime: 0,
  speed: 0,
});

function Row({
  deck,
  direction,
  speed,
  frameWidth,
  running,
  hoverSlow,
}: {
  deck: Voice[];
  direction: 1 | -1;
  speed: number;
  frameWidth: number;
  running: boolean;
  hoverSlow: number;
}) {
  const offset = useMotionValue(0);
  const drive = useRef(freshDrive());
  const [, force] = useState(0);
  const count = deck.length;
  const span = count * PITCH;

  // Enough slats to cover the frame plus a card of bleed on each side.
  const visible = Math.ceil(frameWidth / PITCH) + 2;
  const slats = useMemo(
    () => Array.from({ length: Math.max(visible, count) }, (_, i) => i - Math.floor(visible / 2)),
    [visible, count],
  );

  useAnimationFrame((_, delta) => {
    if (!running) return;
    const seconds = Math.min(0.05, delta / 1000);
    const d = drive.current;
    d.pace += (d.target - d.pace) * Math.min(1, seconds * 5);
    if (!d.dragging) {
      d.boost *= Math.exp(-seconds * 3.2);
      if (Math.abs(d.boost) < 1) d.boost = 0;
      offset.set(offset.get() + (direction * Math.abs(speed) * d.pace + d.boost) * seconds);
    }
    force((n) => (n + 1) % 1000);
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const d = drive.current;
      d.dragging = true;
      d.pointer = e.clientX;
      d.origin = offset.get();
      d.lastX = e.clientX;
      d.lastTime = performance.now();
      d.speed = 0;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drive.current;
      if (!d.dragging) return;
      offset.set(d.origin + (e.clientX - d.pointer));
      const now = performance.now();
      const dt = now - d.lastTime;
      if (dt > 0) d.speed = ((e.clientX - d.lastX) / dt) * 1000;
      d.lastX = e.clientX;
      d.lastTime = now;
    },
    [offset],
  );

  const endDrag = useCallback(() => {
    const d = drive.current;
    if (!d.dragging) return;
    d.dragging = false;
    // Carry the fling into the drift.
    d.boost = Math.max(-2600, Math.min(2600, d.speed));
  }, []);

  return (
    <div
      className="relative h-[272px] cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        endDrag();
        drive.current.target = 1;
      }}
      onMouseEnter={() => (drive.current.target = hoverSlow)}
    >
      {slats.map((i) => {
        const x = fold(i * PITCH + offset.get(), span);
        return (
          <div
            key={i}
            className="absolute top-0 h-full"
            style={{
              width: Math.min(CARD_W, Math.max(220, frameWidth - 32)),
              left: frameWidth / 2 - Math.min(CARD_W, Math.max(220, frameWidth - 32)) / 2,
              transform: `translate3d(${x}px,0,0)`,
              willChange: 'transform',
            }}
          >
            <Card voice={deck[mod(i, count)]} />
          </div>
        );
      })}
    </div>
  );
}

export function TestimonialDrift({ voices }: { voices: Voice[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const quiet = useReducedMotion();
  const running = !quiet && onScreen && !tabHidden && frameWidth > 0;

  // Second row starts half a deck along so the two rows never mirror.
  const lowerDeck = useMemo(() => {
    if (voices.length < 2) return voices;
    const turn = Math.floor(voices.length / 2);
    return voices.slice(turn).concat(voices.slice(0, turn));
  }, [voices]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setFrameWidth(node.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setOnScreen(e.isIntersecting)),
      { rootMargin: '150px 0px', threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden"
      style={{
        // fade the rows out at both edges
        maskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div className="space-y-5">
        <Row
          deck={voices}
          direction={-1}
          speed={38}
          frameWidth={frameWidth}
          running={running}
          hoverSlow={0.25}
        />
        <Row
          deck={lowerDeck}
          direction={1}
          speed={30}
          frameWidth={frameWidth}
          running={running}
          hoverSlow={0.25}
        />
      </div>
    </div>
  );
}
