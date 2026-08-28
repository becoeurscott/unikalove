'use client';
import { Eye, MapPinOff, ShieldCheck } from 'lucide-react';
import { StepHeader } from '../ui';
import type { StepProps } from '../types';

function Toggle({
  on, onChange, title, desc, Icon,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  Icon: typeof Eye;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-300"
    >
      <Icon size={18} className="mt-0.5 shrink-0 text-brand" />
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-gray-500">{desc}</span>
      </span>
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${on ? 'bg-brand' : 'bg-gray-200'}`}
      >
        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

export function Step11Safety({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Votre sécurité, vos règles"
        sub="Ces réglages sont modifiables à tout moment dans les paramètres."
      />

      <div className="space-y-3">
        <Toggle
          Icon={MapPinOff}
          on={draft.showDistance}
          onChange={(v) => set('showDistance', v)}
          title="Afficher la distance"
          desc="Montre « à 5 km » sur votre profil. Votre position exacte reste privée."
        />
        <Toggle
          Icon={Eye}
          on={draft.showAge}
          onChange={(v) => set('showAge', v)}
          title="Afficher mon âge"
          desc="Décochez pour masquer votre âge aux autres membres."
        />
        <Toggle
          Icon={ShieldCheck}
          on={draft.discoverable}
          onChange={(v) => set('discoverable', v)}
          title="Apparaître dans les découvertes"
          desc="Désactivez pour faire une pause sans supprimer votre compte."
        />
      </div>

      <div className="mt-6 rounded-xl bg-brand-soft/50 p-4">
        <h3 className="mb-2 text-sm font-semibold">Nos règles de sécurité</h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li>• Ne partagez jamais d'argent ni de coordonnées bancaires.</li>
          <li>• Le premier rendez-vous se fait dans un lieu public.</li>
          <li>• Prévenez un proche avant de rencontrer quelqu'un.</li>
          <li>• Signalez tout comportement suspect — nous agissons vite.</li>
        </ul>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={draft.acceptTerms}
          onChange={(e) => set('acceptTerms', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span className="text-sm text-gray-600">
          J'ai lu et j'accepte les conditions d'utilisation et la politique de
          confidentialité. J'ai 18 ans ou plus.
        </span>
      </label>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={draft.marketingOptIn}
          onChange={(e) => set('marketingOptIn', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span className="text-sm text-gray-600">
          Recevoir des conseils et des nouveautés par e-mail (optionnel).
        </span>
      </label>
    </>
  );
}
