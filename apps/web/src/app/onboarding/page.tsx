'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/Logo';
import { StepTransition } from '@/components/Motion';
import { Spinner } from '@/components/Spinner';
import { api } from '@/lib/api';
import {
  EMPTY_DRAFT,
  FIRST_STEP,
  MIN_PHOTOS,
  TOTAL_STEPS,
  type OnboardingDraft,
} from './types';
import { Step2Name } from './steps/Step2Name';
import { Step3Location } from './steps/Step3Location';
import { Step4Identity } from './steps/Step4Identity';
import { Step5Looking } from './steps/Step5Looking';
import { Step6Photos } from './steps/Step6Photos';
import { Step7Interests } from './steps/Step7Interests';
import { Step8Lifestyle } from './steps/Step8Lifestyle';
import { Step9Preferences } from './steps/Step9Preferences';
import { Step10Preview } from './steps/Step10Preview';
import { Step11Safety } from './steps/Step11Safety';
import { Step12Ready } from './steps/Step12Ready';

/** Screens the user may skip; the rest must be answered to continue. */
const OPTIONAL = new Set([8, 10]);

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(FIRST_STEP);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Resume where a previous session stopped rather than starting over.
  const existing = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api<any>('/profiles/me'),
    retry: false,
  });

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setDraft((d) => ({
      ...d,
      displayName: p.displayName ?? '',
      birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : '',
      gender: p.gender ?? '',
      city: p.city ?? '',
      country: p.country ?? '',
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
      intent: p.intent ?? '',
      bio: p.bio ?? '',
      photos: (p.photos ?? []).map((ph: any) => ph.url),
      interests: (p.interests ?? []).map((i: any) => i.interest.slug),
      heightCm: p.heightCm ?? undefined,
      education: p.education ?? '',
      occupation: p.occupation ?? '',
      smoking: p.smoking ?? '',
      drinking: p.drinking ?? '',
      religion: p.religion ?? '',
      children: p.children ?? '',
      languages: p.languages ?? [],
      traits: p.traits ?? [],
      showDistance: p.showDistance ?? true,
      showAge: p.showAge ?? true,
      discoverable: p.discoverable ?? true,
    }));
    if (p.onboardingStep > 1) setStep(Math.min(p.onboardingStep, TOTAL_STEPS));
  }, [existing.data]);

  const set = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  /** Everything this screen needs before the user may continue. */
  function blocker(): string | null {
    if (step === 2 && (!draft.displayName.trim() || !draft.birthDate)) {
      return 'Indiquez votre prénom et votre date de naissance.';
    }
    if (step === 3 && !draft.city.trim()) return 'Indiquez votre ville.';
    if (step === 4 && !draft.gender) return 'Choisissez une option.';
    if (step === 5 && !draft.intent) return 'Choisissez ce que vous recherchez.';
    if (step === 6 && draft.photos.length < MIN_PHOTOS) {
      return `Ajoutez au moins ${MIN_PHOTOS} photos — c'est ce qui fait la différence.`;
    }
    if (step === 7 && draft.interests.length < 3) {
      return "Choisissez au moins 3 centres d'intérêt.";
    }
    if (step === 11 && !draft.acceptTerms) {
      return 'Vous devez accepter les conditions pour continuer.';
    }
    return null;
  }

  /**
   * Persists just this screen, so a drop-out never loses earlier answers.
   *
   * The Profile row cannot exist without a gender (screen 4), so screens 2-3
   * are buffered client-side and the first write happens at screen 4 carrying
   * everything collected so far.
   */
  async function persist(current: number) {
    const next = current + 1;
    const profileExists = Boolean(existing.data);
    if (current <= 5) {
      if (!profileExists && current < 4) return; // nothing to write yet
      await api('/profiles/me/step', {
        method: 'PATCH',
        body: {
          displayName: draft.displayName || undefined,
          birthDate: draft.birthDate || undefined,
          gender: draft.gender || undefined,
          city: draft.city || undefined,
          country: draft.country || undefined,
          latitude: draft.latitude,
          longitude: draft.longitude,
          intent: draft.intent || undefined,
          onboardingStep: next,
        },
      });
    } else if (current === 6) {
      // Photos are appended individually; only new ones need saving.
      const saved = (existing.data?.photos ?? []).map((p: any) => p.url);
      for (const url of draft.photos.filter((u) => !saved.includes(u))) {
        await api('/profiles/me/photos', { method: 'POST', body: { url } });
      }
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    } else if (current === 7) {
      await api('/profiles/me/interests', { method: 'PUT', body: { slugs: draft.interests } });
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    } else if (current === 8) {
      await api('/profiles/me/lifestyle', {
        method: 'PUT',
        body: {
          heightCm: draft.heightCm,
          education: draft.education || undefined,
          occupation: draft.occupation || undefined,
          smoking: draft.smoking || undefined,
          drinking: draft.drinking || undefined,
          religion: draft.religion || undefined,
          children: draft.children || undefined,
          languages: draft.languages,
          traits: draft.traits,
        },
      });
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    } else if (current === 9) {
      await api('/profiles/me/preferences', {
        method: 'PUT',
        body: {
          minAge: draft.minAge,
          maxAge: draft.maxAge,
          maxDistanceKm: draft.maxDistanceKm,
          genders: draft.genders,
        },
      });
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    } else if (current === 11) {
      await api('/profiles/me/privacy', {
        method: 'PUT',
        body: {
          showDistance: draft.showDistance,
          showAge: draft.showAge,
          discoverable: draft.discoverable,
          acceptTerms: draft.acceptTerms,
          marketingOptIn: draft.marketingOptIn,
        },
      });
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    } else {
      await api('/profiles/me/step', { method: 'PATCH', body: { onboardingStep: next } });
    }
  }

  async function next() {
    const problem = blocker();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await persist(step);
      go(step + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  const pct = ((step - FIRST_STEP + 1) / (TOTAL_STEPS - FIRST_STEP + 1)) * 100;
  const isFinal = step === TOTAL_STEPS;

  if (existing.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Spinner size={32} className="text-brand" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-brand-cream">
      <div className="sticky top-0 z-10 bg-brand-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 pb-3 pt-5">
          {step > FIRST_STEP && !isFinal ? (
            <button
              onClick={() => go(step - 1)}
              aria-label="Retour"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-white"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <LogoMark size={26} />
          )}
          <div className="h-1.5 flex-1 rounded-full bg-white">
            <div
              className="h-1.5 rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs tabular-nums text-gray-400">
            {step - 1}/{TOTAL_STEPS - 1}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 px-5 pb-32 pt-4">
        <StepTransition step={step} direction={direction}>
          {step === 2 && <Step2Name draft={draft} set={set} />}
          {step === 3 && <Step3Location draft={draft} set={set} />}
          {step === 4 && <Step4Identity draft={draft} set={set} />}
          {step === 5 && <Step5Looking draft={draft} set={set} />}
          {step === 6 && <Step6Photos draft={draft} set={set} />}
          {step === 7 && <Step7Interests draft={draft} set={set} />}
          {step === 8 && <Step8Lifestyle draft={draft} set={set} />}
          {step === 9 && <Step9Preferences draft={draft} set={set} />}
          {step === 10 && <Step10Preview draft={draft} goto={go} />}
          {step === 11 && <Step11Safety draft={draft} set={set} />}
          {step === 12 && <Step12Ready onEnter={() => router.push('/')} />}
        </StepTransition>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {!isFinal && (
        <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
            {OPTIONAL.has(step) && (
              <button
                onClick={() => void next()}
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Passer
              </button>
            )}
            <button
              onClick={() => void next()}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Spinner size={16} />}
              {step === 11 ? 'Terminer' : 'Continuer'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
