'use client';
import { useQuery } from '@tanstack/react-query';
import { ChipMulti, StepHeader } from '../ui';
import { api } from '@/lib/api';
import type { StepProps } from '../types';

const MAX = 8;

export function Step7Interests({ draft, set }: StepProps) {
  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: () => api<{ slug: string; labelFr: string }[]>('/profiles/interests'),
  });

  return (
    <>
      <StepHeader
        title="Qu'est-ce qui vous passionne ?"
        sub={`Choisissez jusqu'à ${MAX} centres d'intérêt — ils servent à vous proposer des personnes compatibles.`}
      />
      <ChipMulti
        max={MAX}
        values={draft.interests}
        onChange={(v) => set('interests', v)}
        options={(interests ?? []).map((i) => ({ value: i.slug, label: i.labelFr }))}
      />
      <p className="mt-4 text-xs text-gray-400">
        {draft.interests.length}/{MAX} sélectionnés
      </p>
    </>
  );
}
