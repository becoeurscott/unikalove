'use client';
import { SearchSelect } from '@/components/SearchSelect';
import {
  EDUCATION_LEVELS,
  LANGUAGES,
  OCCUPATION_OPTIONS,
  RELIGIONS,
  TRAITS,
} from '@/lib/profile-options';
import { ChipMulti, ChoiceRow, Field, StepBody, StepHeader, StepNote, inputClass } from '../ui';
import type { StepProps } from '../types';

const asOptions = (list: string[]) => list.map((v) => ({ value: v, label: v }));

/** Every heading on this screen is centred like the questions above it. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

export function Step8Lifestyle({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Parlez-nous de votre quotidien"
        sub="Tout est optionnel — mais chaque détail améliore vos suggestions."
      />
      <StepBody>
        <div className="space-y-5">
          <Field label="Profession">
            <SearchSelect
              options={OCCUPATION_OPTIONS}
              value={draft.occupation}
              onChange={(v) => set('occupation', v)}
              placeholder="Choisissez votre profession"
              searchPlaceholder="Rechercher un métier…"
            />
          </Field>

          <Field label="Niveau d'études">
            <SearchSelect
              options={asOptions(EDUCATION_LEVELS)}
              value={draft.education}
              onChange={(v) => set('education', v)}
              placeholder="Choisissez un niveau"
              searchPlaceholder="Rechercher…"
            />
          </Field>

          <Field label="Religion">
            <SearchSelect
              options={asOptions(RELIGIONS)}
              value={draft.religion}
              onChange={(v) => set('religion', v)}
              placeholder="Choisissez une option"
              searchPlaceholder="Rechercher…"
            />
          </Field>

          <Field label="Taille (cm)">
            <input
              type="number"
              min={120}
              max={230}
              className={inputClass}
              value={draft.heightCm ?? ''}
              onChange={(e) => set('heightCm', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="170"
            />
          </Field>

          <Group label="Tabac">
            <ChoiceRow
              columns={1}
              value={draft.smoking}
              onChange={(v) => set('smoking', v)}
              options={[
                { value: 'never', label: 'Jamais' },
                { value: 'socially', label: 'Occasionnellement' },
                { value: 'regularly', label: 'Régulièrement' },
              ]}
            />
          </Group>

          <Group label="Alcool">
            <ChoiceRow
              columns={1}
              value={draft.drinking}
              onChange={(v) => set('drinking', v)}
              options={[
                { value: 'never', label: 'Jamais' },
                { value: 'socially', label: 'Occasionnellement' },
                { value: 'regularly', label: 'Régulièrement' },
              ]}
            />
          </Group>

          <Group label="Enfants">
            <ChoiceRow
              columns={1}
              value={draft.children}
              onChange={(v) => set('children', v)}
              options={[
                { value: 'have', label: "J'en ai" },
                { value: 'want', label: "J'en veux" },
                { value: 'none', label: "Je n'en veux pas" },
              ]}
            />
          </Group>

          <Group label="Langues parlées">
            <ChipMulti
              max={5}
              values={draft.languages}
              onChange={(v) => set('languages', v)}
              options={asOptions(LANGUAGES)}
            />
          </Group>

          <Group label="Trois mots qui vous décrivent">
            <ChipMulti
              max={3}
              values={draft.traits}
              onChange={(v) => set('traits', v)}
              options={asOptions(TRAITS)}
            />
          </Group>
        </div>

        <StepNote>
          Ces informations apparaissent sur votre profil. Vous pouvez en masquer une partie plus
          tard depuis vos réglages.
        </StepNote>
      </StepBody>
    </>
  );
}
