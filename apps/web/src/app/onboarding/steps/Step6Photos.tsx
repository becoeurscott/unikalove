'use client';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { StepHeader, inputClass } from '../ui';
import { api } from '@/lib/api';
import type { StepProps } from '../types';

const MAX_PHOTOS = 4;
const MAX_BYTES = 5 * 1024 * 1024;

export function Step6Photos({ draft, set }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');

  // Storage may not be configured; fall back to pasting a URL if so.
  const { data: status } = useQuery({
    queryKey: ['media-status'],
    queryFn: () => api<{ uploads: boolean }>('/media/status'),
    retry: false,
  });
  const canUpload = status?.uploads === true;

  async function upload(file: File) {
    setError('');
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (5 Mo maximum).');
      return;
    }
    setBusy(true);
    try {
      // The API signs a URL; the bytes go straight to storage from the browser.
      const ticket = await api<{ uploadUrl: string; publicUrl: string }>('/media/upload-url', {
        method: 'POST',
        body: { contentType: file.type },
      });
      const put = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      });
      if (!put.ok) throw new Error('upload failed');
      set('photos', [...draft.photos, ticket.publicUrl]);
    } catch {
      setError("L'envoi a échoué. Réessayez ou collez une adresse d'image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StepHeader
        title="Ajoutez 2 à 4 photos"
        sub="Les profils avec au moins deux photos reçoivent bien plus de likes."
      />

      <div className="grid grid-cols-2 gap-3">
        {draft.photos.map((url, i) => (
          <div key={url} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                Principale
              </span>
            )}
            <button
              type="button"
              aria-label="Retirer la photo"
              onClick={() => set('photos', draft.photos.filter((p) => p !== url))}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {draft.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => canUpload && fileRef.current?.click()}
            disabled={busy || !canUpload}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : <ImagePlus size={22} />}
            <span className="text-xs">{busy ? 'Envoi…' : 'Ajouter'}</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />

      {!canUpload && (
        <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            L'envoi de fichiers n'est pas encore activé. Collez l'adresse d'une image :
          </p>
          <div className="flex gap-2">
            <input
              className={inputClass + ' text-sm'}
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!urlDraft.trim()) return;
                set('photos', [...draft.photos, urlDraft.trim()]);
                setUrlDraft('');
              }}
              className="shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-gray-400">
        {draft.photos.length}/{MAX_PHOTOS} · La première photo est votre photo principale.
      </p>
    </>
  );
}
