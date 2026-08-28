'use client';
import { ChipMulti, StepHeader } from '../ui';
import type { StepProps } from '../types';

export function Step9Preferences({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader title="Qui souhaitez-vous rencontrer ?" sub="Vous pourrez tout modifier plus tard." />
      <div className="space-y-6">
        <div>
          <span className="mb-1.5 block text-sm font-medium">Je souhaite voir</span>
          <ChipMulti
            values={draft.genders}
            onChange={(v) => set('genders', v)}
            options={[
              { value: 'FEMALE', label: 'Des femmes' },
              { value: 'MALE', label: 'Des hommes' },
              { value: 'OTHER', label: 'Autre' },
            ]}
          />
          <p className="mt-2 text-xs text-gray-400">
            Laissez vide pour voir tout le monde.
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">
            Âge : {draft.minAge} – {draft.maxAge} ans
          </span>
          <div className="flex items-center gap-3">
            <input
              type="range" min={18} max={80}
              value={draft.minAge}
              onChange={(e) => set('minAge', Math.min(Number(e.target.value), draft.maxAge))}
              className="w-full accent-brand"
              aria-label="Âge minimum"
            />
            <input
              type="range" min={18} max={80}
              value={draft.maxAge}
              onChange={(e) => set('maxAge', Math.max(Number(e.target.value), draft.minAge))}
              className="w-full accent-brand"
              aria-label="Âge maximum"
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">
            Distance maximale : {draft.maxDistanceKm} km
          </span>
          <input
            type="range" min={5} max={2000} step={5}
            value={draft.maxDistanceKm}
            onChange={(e) => set('maxDistanceKm', Number(e.target.value))}
            className="w-full accent-brand"
          />
          <p className="mt-2 text-xs text-gray-400">
            Au-delà de 500 km, vous verrez aussi la diaspora.
          </p>
        </div>
      </div>
    </>
  );
}
