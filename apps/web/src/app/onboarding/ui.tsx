'use client';

/** Shared building blocks so every onboarding screen looks identical. */

export function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      {sub && <p className="mt-1.5 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

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
    <div className={`grid gap-2 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              on
                ? 'border-brand bg-brand-soft font-semibold text-brand'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {o.label}
            {o.hint && <span className="mt-0.5 block text-xs font-normal text-gray-400">{o.hint}</span>}
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
    <div className="flex flex-wrap gap-2">
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
                ? 'bg-brand text-white'
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
