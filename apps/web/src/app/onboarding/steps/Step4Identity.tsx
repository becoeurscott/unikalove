'use client';
import { ChoiceRow, StepHeader } from '../ui';
import type { StepProps } from '../types';

export function Step4Identity({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader title="Je suis…" sub="Cela aide à vous présenter aux bonnes personnes." />
      <ChoiceRow
        columns={1}
        value={draft.gender}
        onChange={(v) => set('gender', v)}
        options={[
          { value: 'FEMALE', label: 'Une femme' },
          { value: 'MALE', label: 'Un homme' },
          { value: 'OTHER', label: 'Autre' },
        ]}
      />
    </>
  );
}
