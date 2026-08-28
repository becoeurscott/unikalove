'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  Baby,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Cigarette,
  GraduationCap,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Ruler,
  Sparkles,
  Wine,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Spinner } from '@/components/Spinner';
import { api, ApiError } from '@/lib/api';
import { playSound } from '@/lib/sound';

interface PublicProfile {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  intent: string | null;
  verified: boolean;
  heightCm: number | null;
  education: string | null;
  occupation: string | null;
  smoking: string | null;
  drinking: string | null;
  religion: string | null;
  children: string | null;
  languages: string[];
  traits: string[];
  photos: string[];
  interests: { slug: string; labelFr: string; shared: boolean }[];
  sharedInterests: number;
  age: number | null;
  distanceKm: number | null;
  liked: boolean;
  saved: boolean;
  likesYou: boolean;
  matched: boolean;
  conversationId: string | null;
}

const INTENT: Record<string, string> = {
  serious: 'Cherche une relation sérieuse',
  open: 'Ouvert(e) à tout',
  friends: "L'amitié d'abord",
};
const HABIT: Record<string, string> = {
  never: 'Jamais',
  socially: 'Occasionnellement',
  regularly: 'Régulièrement',
};
const CHILDREN: Record<string, string> = {
  have: 'A des enfants',
  want: 'En veut',
  none: "N'en veut pas",
};

function Fact({ Icon, children }: { Icon: typeof Ruler; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon size={15} className="shrink-0 text-gray-400" />
      {children}
    </div>
  );
}

/** The full profile behind a discovery card — reached by clicking any member. */
export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [active, setActive] = useState(0);
  const [actionError, setActionError] = useState('');

  const { data: p, isLoading, error } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => api<PublicProfile>(`/profiles/user/${userId}`),
    retry: false,
  });

  const swipe = useMutation({
    mutationFn: (type: 'LIKE' | 'FAVORITE') =>
      api<{ match: { conversation?: { id: string } } | null }>('/swipes', {
        method: 'POST',
        body: { targetId: userId, type },
      }),
    onSuccess: (res, type) => {
      playSound(res.match ? 'match' : type === 'FAVORITE' ? 'save' : 'like');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
      qc.invalidateQueries({ queryKey: ['counts'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      if (res.match) qc.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Action impossible pour le moment.'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} className="text-brand" />
      </div>
    );
  }

  if (error || !p) {
    const gone = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-gray-500">
          {gone ? "Ce profil n'est plus disponible." : 'Impossible de charger ce profil.'}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
        >
          Retour
        </button>
      </div>
    );
  }

  const facts = [
    p.occupation && { Icon: Briefcase, text: p.occupation },
    p.education && { Icon: GraduationCap, text: p.education },
    p.heightCm && { Icon: Ruler, text: `${p.heightCm} cm` },
    p.languages.length > 0 && { Icon: Languages, text: p.languages.join(', ') },
    p.smoking && { Icon: Cigarette, text: `Tabac : ${HABIT[p.smoking] ?? p.smoking}` },
    p.drinking && { Icon: Wine, text: `Alcool : ${HABIT[p.drinking] ?? p.drinking}` },
    p.children && { Icon: Baby, text: CHILDREN[p.children] ?? p.children },
  ].filter(Boolean) as { Icon: typeof Ruler; text: string }[];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-sm">
        <div className="relative flex h-80 items-center justify-center bg-gradient-to-br from-brand-soft to-brand-cream">
          {p.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photos[active]} alt="" className="h-full w-full object-cover" />
          ) : (
            <Avatar name={p.displayName} size={120} />
          )}
          {p.likesYou && (
            <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">
              Vous a aimé(e)
            </span>
          )}
          {p.distanceKm != null && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-600 shadow">
              à {p.distanceKm} km
            </span>
          )}
        </div>

        {p.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-50 p-3">
            {p.photos.map((url, i) => (
              <button
                key={url}
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === active ? 'border-brand' : 'border-transparent opacity-70'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4 p-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {p.displayName}
              {p.age != null && <span className="font-semibold text-gray-500">{p.age}</span>}
              {p.verified && <BadgeCheck size={20} className="text-sky-500" />}
            </h1>
            {(p.city || p.country) && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin size={14} />
                {[p.city, p.country].filter(Boolean).join(', ')}
              </div>
            )}
            {p.intent && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                <Heart size={12} /> {INTENT[p.intent] ?? p.intent}
              </div>
            )}
          </div>

          {p.bio && <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{p.bio}</p>}

          {p.traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.traits.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <div className="grid gap-2 border-t border-gray-50 pt-4 sm:grid-cols-2">
              {facts.map((f) => (
                <Fact key={f.text} Icon={f.Icon}>
                  {f.text}
                </Fact>
              ))}
              {p.religion && <Fact Icon={Sparkles}>{p.religion}</Fact>}
            </div>
          )}

          {p.interests.length > 0 && (
            <div className="border-t border-gray-50 pt-4">
              <h2 className="mb-2 text-sm font-semibold">
                Centres d&apos;intérêt
                {p.sharedInterests > 0 && (
                  <span className="ml-2 text-xs font-normal text-brand">
                    {p.sharedInterests} en commun
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <span
                    key={i.slug}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      i.shared
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {i.labelFr}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="sticky bottom-4 flex gap-3 rounded-card border border-gray-100 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button
          onClick={() => swipe.mutate('FAVORITE')}
          disabled={swipe.isPending || p.saved}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition disabled:opacity-70 ${
            p.saved
              ? 'border-amber-200 bg-amber-50 text-amber-600'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {p.saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          {p.saved ? 'Enregistré' : 'Enregistrer'}
        </button>

        {p.matched ? (
          <Link
            href={p.conversationId ? `/messages/${p.conversationId}` : '/messages'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white"
          >
            <MessageCircle size={17} /> Envoyer un message
          </Link>
        ) : (
          <button
            onClick={() => swipe.mutate('LIKE')}
            disabled={swipe.isPending || p.liked}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-70"
          >
            {swipe.isPending ? <Spinner size={16} /> : <Heart size={17} />}
            {p.liked ? 'Like envoyé' : 'Aimer'}
          </button>
        )}
      </div>
    </div>
  );
}
