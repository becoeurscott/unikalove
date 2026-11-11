'use client';
import { SearchSelect } from '@/components/SearchSelect';
import {
  CHURCH_ATTENDANCE,
  DENOMINATIONS,
  EDUCATION_LEVELS,
  FAITH_IMPORTANCE,
  LANGUAGES,
  OCCUPATION_OPTIONS,
  TRAITS,
} from '@/lib/profile-options';
import { ChipMulti, ChoiceRow, Field, StepBody, StepHeader, StepNote, inputClass } from '../ui';
import type { StepProps } from '../types';

const asOptions = (list: string[]) => list.map((v) => ({ value: v, label: v }));

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
        title="Votre foi et votre quotidien"
        sub="Partagez ce qui compte pour vous — cela aide à trouver quelqu'un qui partage vos valeurs."
      />
      <StepBody>
        <div className="space-y-5">
          <Field label="Dénomination">
            <SearchSelect
              options={asOptions(DENOMINATIONS)}
              value={draft.denomination}
              onChange={(v) => set('denomination', v)}
              placeholder="Choisissez votre dénomination"
              searchPlaceholder="Rechercher…"
            />
          </Field>

          <Group label="Fréquence de culte">
            <ChoiceRow
              columns={1}
              value={draft.churchAttendance}
              onChange={(v) => set('churchAttendance', v)}
              options={asOptions(CHURCH_ATTENDANCE)}
            />
          </Group>

          <Group label="Place de la foi dans votre vie">
            <ChoiceRow
              columns={1}
              value={draft.faithImportance}
              onChange={(v) => set('faithImportance', v)}
              options={asOptions(FAITH_IMPORTANCE)}
            />
          </Group>

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

          <Group label="Ce qui vous décrit le mieux">
            <ChipMulti
              max={3}
              values={draft.traits}
              onChange={(v) => set('traits', v)}
              options={asOptions(TRAITS)}
            />
          </Group>
        </div>

        <StepNote>
          Ces informations apparaissent sur votre profil et aident à vous connecter avec des
          chrétiens qui partagent vos valeurs.
        </StepNote>
      </StepBody>
    </>
  );
}
