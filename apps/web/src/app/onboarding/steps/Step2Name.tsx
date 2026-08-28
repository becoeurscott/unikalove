'use client';
import { Field, StepHeader, inputClass } from '../ui';
import type { StepProps } from '../types';

export function Step2Name({ draft, set }: StepProps) {
  // Under-18 must be blocked at the source, not just server-side.
  const maxDob = new Date(Date.now() - 18 * 365.25 * 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      <StepHeader title="Comment vous appelez-vous ?" sub="C'est ce que les autres verront." />
      <div className="space-y-4">
        <Field label="Prénom">
          <input
            className={inputClass}
            value={draft.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Aïcha"
            autoFocus
          />
        </Field>
        <Field label="Date de naissance">
          <input
            type="date"
            max={maxDob}
            className={inputClass}
            value={draft.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
        </Field>
        <p className="text-xs text-gray-400">
          Votre âge sera affiché, jamais votre date de naissance. UnikaLove est réservé aux
          18 ans et plus.
        </p>
      </div>
    </>
  );
}
