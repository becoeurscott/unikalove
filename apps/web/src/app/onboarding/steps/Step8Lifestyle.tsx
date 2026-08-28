'use client';
import { ChipMulti, ChoiceRow, Field, StepHeader, inputClass } from '../ui';
import type { StepProps } from '../types';

const LANGUAGES = ['Français', 'English', 'Wolof', 'Lingala', 'Bambara', 'Douala', 'Yoruba', 'Swahili', 'Arabe', 'Portugais'];
const TRAITS = ['Drôle', 'Ambitieux(se)', 'Calme', 'Aventurier(ère)', 'Attentionné(e)', 'Créatif(ve)', 'Sportif(ve)', 'Croyant(e)', 'Famille d’abord', 'Curieux(se)'];

export function Step8Lifestyle({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Parlez-nous de votre quotidien"
        sub="Tout est optionnel — mais chaque détail améliore vos suggestions."
      />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Profession">
            <input
              className={inputClass}
              value={draft.occupation}
              onChange={(e) => set('occupation', e.target.value)}
              placeholder="Enseignante"
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Études">
            <input
              className={inputClass}
              value={draft.education}
              onChange={(e) => set('education', e.target.value)}
              placeholder="Licence"
            />
          </Field>
          <Field label="Religion">
            <input
              className={inputClass}
              value={draft.religion}
              onChange={(e) => set('religion', e.target.value)}
              placeholder="Chrétienne"
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Tabac</span>
          <ChoiceRow
            value={draft.smoking}
            onChange={(v) => set('smoking', v)}
            options={[
              { value: 'never', label: 'Jamais' },
              { value: 'socially', label: 'Occasionnellement' },
              { value: 'regularly', label: 'Régulièrement' },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Alcool</span>
          <ChoiceRow
            value={draft.drinking}
            onChange={(v) => set('drinking', v)}
            options={[
              { value: 'never', label: 'Jamais' },
              { value: 'socially', label: 'Occasionnellement' },
              { value: 'regularly', label: 'Régulièrement' },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Enfants</span>
          <ChoiceRow
            value={draft.children}
            onChange={(v) => set('children', v)}
            options={[
              { value: 'have', label: "J'en ai" },
              { value: 'want', label: "J'en veux" },
              { value: 'none', label: "Je n'en veux pas" },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Langues parlées</span>
          <ChipMulti
            max={5}
            values={draft.languages}
            onChange={(v) => set('languages', v)}
            options={LANGUAGES.map((l) => ({ value: l, label: l }))}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Trois mots qui vous décrivent</span>
          <ChipMulti
            max={3}
            values={draft.traits}
            onChange={(v) => set('traits', v)}
            options={TRAITS.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </div>
    </>
  );
}
