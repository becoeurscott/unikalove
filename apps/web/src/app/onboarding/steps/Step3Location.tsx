'use client';
import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SearchSelect, type Option } from '@/components/SearchSelect';
import { COUNTRIES, PRIORITY_CODES, findCountry } from '@/lib/countries';
import { Field, StepBody, StepHeader, StepNote, inputClass } from '../ui';
import type { StepProps } from '../types';

export function Step3Location({ draft, set }: StepProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const options = useMemo<Option[]>(
    () =>
      COUNTRIES.map((c) => ({
        value: c.name,
        label: c.name,
        prefix: c.flag,
        priority: PRIORITY_CODES.includes(c.code),
      })),
    [],
  );

  // Profiles created before the picker stored free text; keep it selectable.
  const value = findCountry(draft.country)?.name ?? '';

  /** Coordinates power distance search; the city is what other users see. */
  function detect() {
    if (!navigator.geolocation) {
      setGeoError("Votre navigateur ne permet pas la géolocalisation.");
      return;
    }
    setGeoError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setGeoError("Position indisponible — renseignez votre ville à la main.");
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  return (
    <>
      <StepHeader
        title="Où habitez-vous ?"
        sub="Pour vous proposer des personnes proches de vous."
      />
      <StepBody>
        <div className="space-y-4">
          <Field label="Pays">
            <SearchSelect
              options={options}
              value={value}
              onChange={(v) => set('country', v)}
              placeholder="Choisissez votre pays"
              searchPlaceholder="Rechercher un pays…"
            />
          </Field>
          <Field label="Ville">
            <input
              className={inputClass}
              value={draft.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Douala"
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
          {geoError && <p className="text-xs text-amber-700">{geoError}</p>}
        </div>
        <StepNote>
          Seule votre ville est visible. Votre position exacte n&apos;est jamais partagée — elle
          sert uniquement à calculer une distance approximative.
        </StepNote>
      </StepBody>
    </>
  );
}
