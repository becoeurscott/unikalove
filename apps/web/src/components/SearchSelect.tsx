'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface Option {
  value: string;
  label: string;
  /** Rendered before the label — a flag emoji, an icon character. */
  prefix?: string;
  /** Pulled to the top of the list, above a separator. */
  priority?: boolean;
}

function fold(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * A single-select that the user picks from rather than types into.
 *
 * Onboarding needs this for country, job, education and religion: free text
 * made those fields unusable for filtering, and a native <select> cannot be
 * searched on a phone once the list passes a few dozen entries.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  allowClear = true,
  id,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  // Clicking anywhere else closes the list; Escape does too.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery('');
  }, [open]);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    const matches = q ? options.filter((o) => fold(o.label).includes(q)) : options;
    // Without a query the favourites float to the top; a search is flat.
    if (q) return matches;
    return [...matches].sort((a, b) => Number(!!b.priority) - Number(!!a.priority));
  }, [options, query]);

  const firstNonPriority = !query && shown.findIndex((o) => !o.priority);

  return (
    <div ref={boxRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition ${
          open ? 'border-brand ring-2 ring-brand/10' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={`truncate ${selected ? '' : 'text-gray-400'}`}>
          {selected ? `${selected.prefix ? selected.prefix + '  ' : ''}${selected.label}` : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {allowClear && selected && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Effacer"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={15} className="shrink-0 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-1 text-sm outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {shown.map((o, i) => (
              <li key={o.value}>
                {i === firstNonPriority && i > 0 && (
                  <div className="my-1 border-t border-gray-100" />
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition ${
                    o.value === value ? 'bg-brand-soft font-semibold text-brand' : 'hover:bg-gray-50'
                  }`}
                >
                  {o.prefix && <span className="w-5 shrink-0 text-base">{o.prefix}</span>}
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === value && <Check size={15} className="shrink-0" />}
                </button>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="px-3.5 py-6 text-center text-sm text-gray-400">Aucun résultat</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
