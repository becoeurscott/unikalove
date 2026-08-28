'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ChipMulti, StepBody, StepHeader, StepNote, inputClass } from '../ui';
import { api } from '@/lib/api';
import type { StepProps } from '../types';

const MAX = 8;

interface InterestRow {
  slug: string;
  labelFr: string;
  category: string;
}

interface InterestPayload {
  categories: { key: string; labelFr: string }[];
  interests: InterestRow[];
}

function fold(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function Step7Interests({ draft, set }: StepProps) {
  const [query, setQuery] = useState('');
  const { data } = useQuery({
    queryKey: ['interests'],
    queryFn: () => api<InterestPayload>('/profiles/interests'),
  });

  // One section per category, in the order the API returns them; a search
  // collapses everything into a single flat list of matches.
  const sections = useMemo(() => {
    const rows = data?.interests ?? [];
    const q = fold(query.trim());
    const matching = q ? rows.filter((r) => fold(r.labelFr).includes(q)) : rows;
    if (q) return [{ key: 'search', labelFr: 'Résultats', rows: matching }];
    return (data?.categories ?? [])
      .map((c) => ({ ...c, rows: matching.filter((r) => r.category === c.key) }))
      .filter((c) => c.rows.length > 0);
  }, [data, query]);

  return (
    <>
      <StepHeader
        title="Qu'est-ce qui vous passionne ?"
        sub={`Choisissez jusqu'à ${MAX} centres d'intérêt — ils servent à vous proposer des personnes compatibles.`}
      />
      <StepBody>
        <div className="relative mb-5">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un centre d'intérêt…"
            className={inputClass + ' pl-9 text-sm'}
          />
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key}>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {section.labelFr}
              </h2>
              <ChipMulti
                max={MAX}
                values={draft.interests}
                onChange={(v) => set('interests', v)}
                options={section.rows.map((i) => ({ value: i.slug, label: i.labelFr }))}
              />
            </div>
          ))}
          {data && sections.length === 0 && (
            <p className="py-6 text-sm text-gray-400">Aucun centre d&apos;intérêt trouvé.</p>
          )}
        </div>

        <StepNote>
          {draft.interests.length}/{MAX} sélectionnés · 3 minimum pour continuer.
        </StepNote>
      </StepBody>
    </>
  );
}
