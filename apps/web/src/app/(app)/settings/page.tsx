'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldOff, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Preference {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  genders: string[];
}

interface BlockRow {
  id: string;
  blockedId: string;
  blocked: { id: string; profile: { displayName: string } | null };
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<Preference>({
    minAge: 18,
    maxAge: 60,
    maxDistanceKm: 500,
    genders: [],
  });
  const [saved, setSaved] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api<{ id: string }>('/profiles/me'),
  });
  const { data: blocks } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api<BlockRow[]>('/blocks'),
  });

  useEffect(() => {
    // Preferences ride on the profile response? They don't — fetch is not exposed; keep local defaults.
  }, [profile]);

  const savePrefs = useMutation({
    mutationFn: () => api('/profiles/me/preferences', { method: 'PUT', body: prefs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const unblock = useMutation({
    mutationFn: (userId: string) => api(`/blocks/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api('/users/me', { method: 'DELETE' }),
    onSuccess: () => logout(),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="text-sm text-gray-500">Préférences de recherche et compte</p>
      </div>

      <section className="space-y-4 rounded-card border border-gray-100 bg-white p-6">
        <h2 className="font-semibold">Préférences de découverte</h2>
        <div>
          <label className="text-sm font-medium">Je recherche</label>
          <select
            value={prefs.genders[0] ?? ''}
            onChange={(e) => setPrefs((p) => ({ ...p, genders: e.target.value ? [e.target.value] : [] }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
          >
            <option value="">Tout le monde</option>
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
          <label className="text-sm font-medium">Distance max : {prefs.maxDistanceKm} km</label>
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
        <button
          onClick={() => savePrefs.mutate()}
          disabled={savePrefs.isPending}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </section>

      <section className="rounded-card border border-gray-100 bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <ShieldOff size={17} /> Utilisateurs bloqués
        </h2>
        <ul className="space-y-2">
          {(blocks ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm">
              <span>{b.blocked.profile?.displayName ?? 'Utilisateur'}</span>
              <button
                onClick={() => unblock.mutate(b.blockedId)}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
              >
                Débloquer
              </button>
            </li>
          ))}
          {blocks?.length === 0 && (
            <li className="text-sm text-gray-400">Aucun utilisateur bloqué</li>
          )}
        </ul>
      </section>

      <section className="rounded-card border border-red-100 bg-white p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-red-600">
          <Trash2 size={17} /> Zone dangereuse
        </h2>
        <p className="mb-3 text-sm text-gray-500">
          La suppression désactive votre compte et efface vos données conformément à notre politique
          de confidentialité.
        </p>
        <button
          onClick={() => {
            if (confirm('Supprimer définitivement votre compte UnikaLove ?')) {
              deleteAccount.mutate();
            }
          }}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Supprimer mon compte
        </button>
      </section>
    </div>
  );
}
