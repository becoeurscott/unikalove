'use client';
import { Crown, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ChipMulti, StepBody, StepHeader, StepNote } from '../ui';
import { FREE_MAX_DISTANCE_KM, type StepProps } from '../types';

const GENDERS = [
  { value: 'FEMALE', label: 'Des femmes' },
  { value: 'MALE', label: 'Des hommes' },
  { value: 'OTHER', label: 'Autre' },
];

function UpgradeHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-brand-soft/60 p-3 text-left">
      <Crown size={15} className="mt-0.5 shrink-0 text-brand-gold" />
      <p className="text-xs leading-relaxed text-gray-600">
        {children}{' '}
        <Link href="/premium" className="font-semibold text-brand hover:underline">
          Voir Premium
        </Link>
      </p>
    </div>
  );
}

export function Step9Preferences({ draft, set }: StepProps) {
  const { user } = useAuth();
  // Combining genders and searching past FREE_MAX_DISTANCE_KM are the two paid
  // levers here; the API enforces the same two rules on save.
  const free = !user || user.plan === 'FREE';
  const maxDistance = free ? FREE_MAX_DISTANCE_KM : 2000;

  function setGenders(values: string[]) {
    if (!free || values.length <= 1) {
      set('genders', values);
      return;
    }
    // Free plan: the last tap replaces the selection instead of adding to it.
    set('genders', values.slice(-1));
  }

  return (
    <>
      <StepHeader
        title="Qui souhaitez-vous rencontrer ?"
        sub="Vous pourrez tout modifier plus tard."
      />
      <StepBody>
        <div className="space-y-7">
          <div>
            <span className="mb-2 block text-sm font-medium">Je souhaite voir</span>
            <ChipMulti values={draft.genders} onChange={setGenders} options={GENDERS} />
            {free ? (
              <UpgradeHint>
                Avec un compte gratuit, vous choisissez un seul genre à la fois. Premium permet de
                les combiner.
              </UpgradeHint>
            ) : (
              <p className="mt-2 text-xs text-gray-400">Laissez vide pour voir tout le monde.</p>
            )}
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">
              Âge : {draft.minAge} – {draft.maxAge} ans
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={18}
                max={80}
                value={draft.minAge}
                onChange={(e) => set('minAge', Math.min(Number(e.target.value), draft.maxAge))}
                className="w-full accent-brand"
                aria-label="Âge minimum"
              />
              <input
                type="range"
                min={18}
                max={80}
                value={draft.maxAge}
                onChange={(e) => set('maxAge', Math.max(Number(e.target.value), draft.minAge))}
                className="w-full accent-brand"
                aria-label="Âge maximum"
              />
            </div>
          </div>

          <div>
            <span className="mb-2 flex items-center justify-center gap-1.5 text-sm font-medium">
              Distance maximale : {Math.min(draft.maxDistanceKm, maxDistance)} km
              {free && <Lock size={12} className="text-gray-400" />}
            </span>
            <input
              type="range"
              min={5}
              max={maxDistance}
              step={5}
              value={Math.min(draft.maxDistanceKm, maxDistance)}
              onChange={(e) => set('maxDistanceKm', Number(e.target.value))}
              className="w-full accent-brand"
            />
            {free ? (
              <UpgradeHint>
                La recherche gratuite s&apos;arrête à {FREE_MAX_DISTANCE_KM} km. Premium ouvre le
                rayon jusqu&apos;à 2 000 km et vous donne accès à la diaspora.
              </UpgradeHint>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                Au-delà de 500 km, vous verrez aussi la diaspora.
              </p>
            )}
          </div>
        </div>

        <StepNote>
          Ces critères filtrent vos découvertes — élargissez-les si vous voyez trop peu de profils.
        </StepNote>
      </StepBody>
    </>
  );
}
