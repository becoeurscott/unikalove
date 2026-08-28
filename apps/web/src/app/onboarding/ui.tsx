'use client';

import type { LucideIcon } from 'lucide-react';

/** Shared building blocks so every onboarding screen looks identical. */

export function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-7 text-center">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{sub}</p>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

/** Wraps a screen's body so every question sits on the same centred column. */
export function StepBody({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-sm text-center">{children}</div>;
}

/** A note under a question — the reassurance text every screen carries. */
export function StepNote({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-gray-400">{children}</p>;
}

/** Single-select chip row. */
export function ChoiceRow({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
}) {
  return (
    <div className={`grid gap-2.5 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-3.5 text-center text-sm transition ${
              on
                ? 'border-brand bg-brand-soft font-semibold text-brand shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {o.label}
            {o.hint && (
              <span className="mt-0.5 block text-xs font-normal text-gray-400">{o.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Single-select cards with the icon above the label. Used where the choice is
 * identity-shaped ("I am…", "I'm looking for…") and an icon reads faster than
 * a line of text.
 */
export function IconChoice({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: string; label: string; hint?: string; Icon: LucideIcon }[];
  value: string;
  onChange: (v: string) => void;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className={`grid gap-3 ${cols}`}>
      {options.map(({ value: v, label, hint, Icon }) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-5 text-center transition ${
              on
                ? 'border-brand bg-brand-soft shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                on ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={on ? 2.3 : 2} />
            </span>
            <span className={`text-sm leading-tight ${on ? 'font-semibold text-brand' : ''}`}>
              {label}
            </span>
            {hint && <span className="text-[11px] leading-tight text-gray-400">{hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Multi-select chips with an optional cap. */
export function ChipMulti({
  options,
  values,
  onChange,
  max,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((o) => {
        const on = values.includes(o.value);
        const full = !!max && values.length >= max && !on;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={full}
            onClick={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
            className={`rounded-full px-3.5 py-2 text-sm transition ${
              on
                ? 'bg-brand text-white shadow-sm shadow-brand/25'
                : full
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
