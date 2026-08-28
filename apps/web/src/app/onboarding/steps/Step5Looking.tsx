'use client';
import { ChoiceRow, StepHeader } from '../ui';
import type { StepProps } from '../types';

export function Step5Looking({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Que recherchez-vous ?"
        sub="Soyez honnête — c'est ce qui évite les malentendus."
      />
      <ChoiceRow
        columns={1}
        value={draft.intent}
        onChange={(v) => set('intent', v)}
        options={[
          { value: 'serious', label: 'Une relation sérieuse', hint: 'Construire quelque chose de durable' },
          { value: 'open', label: 'Ouvert(e) à tout', hint: 'Voir où cela mène' },
          { value: 'friends', label: "L'amitié d'abord", hint: 'Rencontrer des gens, sans pression' },
        ]}
      />
    </>
  );
}
