'use client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ImagePlus, Link2, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { StepBody, StepHeader, StepNote, inputClass } from '../ui';
import { api, apiUpload } from '@/lib/api';
import { MIN_PHOTOS, type StepProps } from '../types';

const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Confirms a pasted address really resolves to a usable image before it is
 * added — a 404, an HTML page or a hotlink-blocked host all fail here rather
 * than becoming a broken tile on the user's profile.
 */
function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok: boolean) => {
      img.onload = img.onerror = null;
      resolve(ok);
    };
    img.onload = () => done(img.naturalWidth > 0);
    img.onerror = () => done(false);
    img.src = url;
    // Some hosts never fire either handler; do not hang the button on them.
    setTimeout(() => done(false), 10_000);
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function Step6Photos({ draft, set }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  // `direct` means Supabase signs an upload URL; otherwise the bytes go
  // through the API. Either way uploading works, so the button is never dead.
  const { data: status } = useQuery({
    queryKey: ['media-status'],
    queryFn: () => api<{ uploads: boolean; direct: boolean }>('/media/status'),
    retry: false,
  });

  function add(url: string) {
    set('photos', [...draft.photos, url]);
    setError('');
  }

  async function upload(file: File) {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Formats acceptés : JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (5 Mo maximum).');
      return;
    }
    setBusy(true);
    try {
      if (status?.direct) {
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
        add(ticket.publicUrl);
      } else {
        const { url } = await apiUpload<{ url: string }>('/media/upload', file);
        add(url);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `L'envoi a échoué : ${err.message}`
          : "L'envoi a échoué. Réessayez ou collez l'adresse d'une image.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addFromUrl() {
    const url = urlDraft.trim();
    setError('');
    if (!url) return;
    if (!isHttpUrl(url)) {
      setError("Ceci n'est pas un lien valide. Il doit commencer par http:// ou https://.");
      return;
    }
    if (draft.photos.includes(url)) {
      setError('Cette photo est déjà dans votre profil.');
      return;
    }
    setChecking(true);
    const ok = await probeImage(url);
    setChecking(false);
    if (!ok) {
      setError("Ce lien ne renvoie pas une image affichable. Essayez une autre adresse ou envoyez le fichier.");
      return;
    }
    add(url);
    setUrlDraft('');
  }

  const remaining = Math.max(0, MIN_PHOTOS - draft.photos.length);

  return (
    <>
      <StepHeader
        title={`Ajoutez au moins ${MIN_PHOTOS} photos`}
        sub="Les profils avec plusieurs photos reçoivent bien plus de likes."
      />
      <StepBody>
        <div className="grid grid-cols-3 gap-2.5">
          {draft.photos.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  // A photo that stops loading later is dropped rather than
                  // left as a broken tile other members would see.
                  e.currentTarget.style.display = 'none';
                  setError("Une photo n'a pas pu être chargée — elle a été retirée.");
                  set(
                    'photos',
                    draft.photos.filter((p) => p !== url),
                  );
                }}
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                  Principale
                </span>
              )}
              <button
                type="button"
                aria-label="Retirer la photo"
                onClick={() =>
                  set(
                    'photos',
                    draft.photos.filter((p) => p !== url),
                  )
                }
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {draft.photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-brand hover:text-brand disabled:opacity-60"
            >
              {busy ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}
              <span className="text-[11px]">{busy ? 'Envoi…' : 'Ajouter'}</span>
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = '';
          }}
        />

        <div className="mt-4">
          {!showUrl ? (
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
            >
              <Link2 size={13} /> Utiliser le lien d&apos;une image
            </button>
          ) : (
            <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-left">
              <p className="text-xs text-gray-500">
                Collez l&apos;adresse directe d&apos;une image (elle doit se terminer par
                .jpg, .png ou .webp) :
              </p>
              <div className="flex gap-2">
                <input
                  className={inputClass + ' text-sm'}
                  placeholder="https://…"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void addFromUrl()}
                />
                <button
                  type="button"
                  onClick={() => void addFromUrl()}
                  disabled={checking || !urlDraft.trim()}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {checking && <Loader2 className="animate-spin" size={14} />}
                  {checking ? 'Vérification' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-left text-sm text-red-600">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <StepNote>
          {draft.photos.length}/{MAX_PHOTOS} · La première photo est votre photo principale.
          {remaining > 0 && (
            <>
              {' '}
              Encore {remaining} pour continuer.
            </>
          )}
        </StepNote>
      </StepBody>
    </>
  );
}
