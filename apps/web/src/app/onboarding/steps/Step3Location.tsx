'use client';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Field, StepHeader, inputClass } from '../ui';
import type { StepProps } from '../types';

export function Step3Location({ draft, set }: StepProps) {
  const [locating, setLocating] = useState(false);

  /** Coordinates power distance search; the city is what other users see. */
  function detect() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  return (
    <>
      <StepHeader title="Où habitez-vous ?" sub="Pour vous proposer des personnes proches de vous." />
      <div className="space-y-4">
        <Field label="Ville">
          <input
            className={inputClass}
            value={draft.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Douala"
            autoFocus
          />
        </Field>
        <Field label="Pays">
          <input
            className={inputClass}
            value={draft.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="Cameroun"
          />
        </Field>

        <button
          type="button"
          onClick={detect}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 py-3 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
        >
          <MapPin size={16} />
          {locating
            ? 'Localisation…'
            : draft.latitude
              ? 'Position enregistrée ✓'
              : 'Utiliser ma position actuelle'}
        </button>
        <p className="text-xs text-gray-400">
          Seule votre ville est visible. Votre position exacte n'est jamais partagée — elle
          sert uniquement à calculer une distance approximative.
        </p>
      </div>
    </>
  );
}
