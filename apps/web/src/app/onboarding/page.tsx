'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Interest {
  id: string;
  slug: string;
  labelFr: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    gender: 'FEMALE',
    birthDate: '',
    city: '',
    country: '',
    bio: '',
    intent: 'serious',
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({ minAge: 20, maxAge: 45, maxDistanceKm: 500, genders: ['MALE'] });

  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: () => api<Interest[]>('/profiles/interests'),
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              latitude = pos.coords.latitude;
              longitude = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 },
          );
        });
      }
      await api('/profiles/me', {
        method: 'PUT',
        body: { ...form, birthDate: form.birthDate, latitude, longitude },
      });
      if (selected.length) {
        await api('/profiles/me/interests', { method: 'PUT', body: { slugs: selected } });
      }
      await api('/profiles/me/preferences', { method: 'PUT', body: prefs });
      // Finish on checkout when the user arrived from a paid-plan CTA.
      let next = '/';
      try {
        const plan = sessionStorage.getItem('unika_intended_plan');
        if (plan) {
          sessionStorage.removeItem('unika_intended_plan');
          next = '/premium';
        }
      } catch {
        /* storage unavailable */
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <div className="w-full max-w-lg rounded-card bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-gray-400">
            <span>Étape {step} / 3</span>
            <span>
              {step === 1 ? 'Votre profil' : step === 2 ? 'Vos centres d’intérêt' : 'Vos préférences'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-brand transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <input
              value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              placeholder="Prénom affiché"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
              >
                <option value="FEMALE">Femme</option>
                <option value="MALE">Homme</option>
                <option value="OTHER">Autre</option>
              </select>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Ville"
                className="rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
              />
              <input
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                placeholder="Pays"
                className="rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
              />
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Parlez de vous (min. 20 caractères pour compléter votre profil)"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
            />
            <select
              value={form.intent}
              onChange={(e) => set('intent', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
            >
              <option value="serious">Relation sérieuse</option>
              <option value="open">Ouvert(e) à tout</option>
              <option value="friends">Amitié d&apos;abord</option>
            </select>
            <button
              disabled={!form.displayName || !form.birthDate}
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {(interests ?? []).map((it) => {
                const on = selected.includes(it.slug);
                return (
                  <button
                    key={it.slug}
                    onClick={() =>
                      setSelected((s) => (on ? s.filter((x) => x !== it.slug) : [...s, it.slug]))
                    }
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      on ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {it.labelFr}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 font-medium text-gray-600"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg bg-brand py-2.5 font-semibold text-white"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Je recherche</label>
              <select
                value={prefs.genders[0]}
                onChange={(e) => setPrefs((p) => ({ ...p, genders: [e.target.value] }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
              >
                <option value="MALE">Des hommes</option>
                <option value="FEMALE">Des femmes</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Âge min</label>
                <input
                  type="number"
                  min={18}
                  value={prefs.minAge}
                  onChange={(e) => setPrefs((p) => ({ ...p, minAge: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Âge max</label>
                <input
                  type="number"
                  max={100}
                  value={prefs.maxAge}
                  onChange={(e) => setPrefs((p) => ({ ...p, maxAge: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Distance max : {prefs.maxDistanceKm} km
              </label>
              <input
                type="range"
                min={10}
                max={20000}
                step={10}
                value={prefs.maxDistanceKm}
                onChange={(e) => setPrefs((p) => ({ ...p, maxDistanceKm: Number(e.target.value) }))}
                className="mt-1 w-full accent-brand"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 font-medium text-gray-600"
              >
                Retour
              </button>
              <button
                disabled={busy}
                onClick={finish}
                className="flex-1 rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Enregistrement…' : 'Terminer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
