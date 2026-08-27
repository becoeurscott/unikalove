'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompletenessRing } from '@/components/CompletenessRing';
import { api } from '@/lib/api';

interface MyProfile {
  displayName: string;
  bio: string | null;
  gender: string;
  birthDate: string;
  city: string | null;
  country: string | null;
  intent: string | null;
  verified: boolean;
  completeness: number;
  latitude: number | null;
  longitude: number | null;
  photos: { id: string; url: string }[];
  interests: { interest: { slug: string; labelFr: string } }[];
}

interface Interest {
  slug: string;
  labelFr: string;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api<MyProfile>('/profiles/me'),
  });
  // AI profile advice — loaded on demand so we don't spend budget on every visit.
  const [showAdvice, setShowAdvice] = useState(false);
  const advice = useQuery({
    queryKey: ['profile-suggestions'],
    queryFn: () => api<{ suggestions: string[] }>('/ai/profile-suggestions'),
    enabled: showAdvice,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const { data: allInterests } = useQuery({
    queryKey: ['interests'],
    queryFn: () => api<Interest[]>('/profiles/interests'),
  });

  const [form, setForm] = useState({ displayName: '', bio: '', city: '', country: '', intent: 'serious' });
  const [photoUrl, setPhotoUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setForm({
        displayName: me.displayName,
        bio: me.bio ?? '',
        city: me.city ?? '',
        country: me.country ?? '',
        intent: me.intent ?? 'serious',
      });
    }
  }, [me]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-profile'] });

  const save = useMutation({
    mutationFn: () =>
      api('/profiles/me', {
        method: 'PUT',
        body: {
          ...form,
          gender: me!.gender,
          birthDate: me!.birthDate,
          latitude: me!.latitude ?? undefined,
          longitude: me!.longitude ?? undefined,
        },
      }),
    onSuccess: () => {
      invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addPhoto = useMutation({
    mutationFn: () => api('/profiles/me/photos', { method: 'POST', body: { url: photoUrl } }),
    onSuccess: () => {
      setPhotoUrl('');
      invalidate();
    },
  });

  const removePhoto = useMutation({
    mutationFn: (id: string) => api(`/profiles/me/photos/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const setInterests = useMutation({
    mutationFn: (slugs: string[]) =>
      api('/profiles/me/interests', { method: 'PUT', body: { slugs } }),
    onSuccess: invalidate,
  });

  const submitVerification = useMutation({
    mutationFn: (selfieUrl: string) =>
      api('/profiles/me/verification', { method: 'POST', body: { selfieUrl } }),
  });

  const mySlugs = me?.interests.map((i) => i.interest.slug) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Mon profil
            {me?.verified && <BadgeCheck className="text-sky-500" size={20} />}
          </h1>
          <p className="text-sm text-gray-500">Un profil complet reçoit plus de likes</p>
        </div>
        <CompletenessRing value={me?.completeness ?? 0} size={72} />
      </div>

      <section className="rounded-card border border-brand/20 bg-brand-soft/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand" size={18} />
            <h2 className="font-semibold">Conseils IA pour votre profil</h2>
          </div>
          {!showAdvice && (
            <button
              onClick={() => setShowAdvice(true)}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
            >
              Analyser mon profil
            </button>
          )}
        </div>
        {showAdvice && (
          <div className="mt-3">
            {advice.isLoading && <p className="text-sm text-gray-500">Analyse en cours…</p>}
            {advice.isError && (
              <p className="text-sm text-gray-500">
                Conseils indisponibles pour le moment.
              </p>
            )}
            <ul className="space-y-2">
              {(advice.data?.suggestions ?? []).map((s) => (
                <li key={s} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-brand">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-card border border-gray-100 bg-white p-6">
        <h2 className="font-semibold">Informations</h2>
        <input
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          placeholder="Prénom affiché"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
        />
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={3}
          placeholder="Bio (min. 20 caractères)"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ville"
            className="rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
          />
          <input
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="Pays"
            className="rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <select
          value={form.intent}
          onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
        >
          <option value="serious">Relation sérieuse</option>
          <option value="open">Ouvert(e) à tout</option>
          <option value="friends">Amitié d&apos;abord</option>
        </select>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </section>

      <section className="rounded-card border border-gray-100 bg-white p-6">
        <h2 className="mb-3 font-semibold">Photos</h2>
        <div className="mb-3 flex flex-wrap gap-3">
          {(me?.photos ?? []).map((p) => (
            <div key={p.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-24 w-24 rounded-lg object-cover" />
              <button
                onClick={() => removePhoto.mutate(p.id)}
                className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-1 text-white group-hover:block"
                aria-label="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {me?.photos.length === 0 && (
            <p className="text-sm text-gray-400">Ajoutez jusqu&apos;à 3 photos (+10% chacune)</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="URL de la photo (l'upload arrive bientôt)"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={() => addPhoto.mutate()}
            disabled={!photoUrl || addPhoto.isPending}
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </section>

      <section className="rounded-card border border-gray-100 bg-white p-6">
        <h2 className="mb-3 font-semibold">Centres d&apos;intérêt</h2>
        <div className="flex flex-wrap gap-2">
          {(allInterests ?? []).map((it) => {
            const on = mySlugs.includes(it.slug);
            return (
              <button
                key={it.slug}
                onClick={() =>
                  setInterests.mutate(
                    on ? mySlugs.filter((s) => s !== it.slug) : [...mySlugs, it.slug],
                  )
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
      </section>

      {!me?.verified && (
        <section className="rounded-card border border-gray-100 bg-white p-6">
          <h2 className="mb-1 font-semibold">Vérification du profil</h2>
          <p className="mb-3 text-sm text-gray-500">
            Obtenez le badge vérifié ✓ en soumettant un selfie. Un modérateur l&apos;examinera.
          </p>
          {submitVerification.isSuccess ? (
            <p className="text-sm font-medium text-emerald-600">
              Demande envoyée — en cours d&apos;examen.
            </p>
          ) : (
            <button
              onClick={() => {
                const url = prompt('URL de votre selfie :');
                if (url) submitVerification.mutate(url);
              }}
              className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Demander la vérification
            </button>
          )}
        </section>
      )}
    </div>
  );
}
