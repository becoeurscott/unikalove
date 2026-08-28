'use client';
import { BadgeCheck, MapPin, Pencil } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { StepHeader } from '../ui';
import type { OnboardingDraft } from '../types';

function age(iso: string) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 31_557_600_000);
}

/** Screen 10 — shows the card exactly as other members will see it. */
export function Step10Preview({
  draft,
  goto,
}: {
  draft: OnboardingDraft;
  goto: (step: number) => void;
}) {
  const yrs = age(draft.birthDate);
  const facts = [
    draft.occupation,
    draft.heightCm ? `${draft.heightCm} cm` : null,
    draft.education,
  ].filter(Boolean);

  return (
    <>
      <StepHeader
        title="Voici votre profil"
        sub="C'est ce que les autres verront. Modifiez ce que vous voulez avant de continuer."
      />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-brand-soft to-brand-cream">
          {draft.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <Avatar name={draft.displayName || '?'} size={96} />
          )}
          <button
            type="button"
            onClick={() => goto(6)}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow"
          >
            <Pencil size={12} /> Photos
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-lg font-bold">
              {draft.displayName || 'Votre prénom'}
              {yrs && <span>, {yrs}</span>}
              <BadgeCheck size={16} className="text-gray-300" />
            </div>
            <button type="button" onClick={() => goto(2)} className="text-xs font-medium text-brand">
              Modifier
            </button>
          </div>

          {draft.city && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={13} /> {draft.city}
              {draft.country ? `, ${draft.country}` : ''}
            </div>
          )}

          {facts.length > 0 && (
            <p className="text-sm text-gray-600">{facts.join(' · ')}</p>
          )}

          {draft.traits.length > 0 && (
            <p className="text-sm text-gray-600">{draft.traits.join(' · ')}</p>
          )}

          {draft.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {draft.interests.slice(0, 6).map((t) => (
                <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  {t}
                </span>
              ))}
              <button
                type="button"
                onClick={() => goto(7)}
                className="rounded-full px-2 py-1 text-xs font-medium text-brand"
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      </div>

      {draft.photos.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Sans photo, votre profil sera rarement consulté. Ajoutez-en au moins une.
        </p>
      )}
    </>
  );
}
