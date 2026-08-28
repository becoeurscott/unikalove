'use client';

import { useMutation } from '@tanstack/react-query';
import { Crown, Lock, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/Spinner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const PROMPTS = [
  'Comment démarrer une conversation sans être banal ?',
  'Mon match ne répond plus, que faire ?',
  'Des idées de premier rendez-vous à petit budget ?',
  'Comment rester en sécurité lors d’une première rencontre ?',
];

export default function CoachPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (message: string) =>
      api<{ answer: string }>('/ai/coach', {
        method: 'POST',
        body: { message, history: turns.slice(-6) },
      }),
    onSuccess: (res) => setTurns((t) => [...t, { role: 'assistant', content: res.answer }]),
    onError: () =>
      setTurns((t) => [
        ...t,
        { role: 'assistant', content: "Désolé, le coach est indisponible pour le moment." },
      ]),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, ask.isPending]);

  function send(message: string) {
    const text = message.trim();
    if (!text || ask.isPending) return;
    setTurns((t) => [...t, { role: 'user', content: text }]);
    setDraft('');
    ask.mutate(text);
  }

  // Premium-only: show the offer rather than letting the request 403.
  if (user && user.plan === 'FREE') {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
          <Lock className="text-brand" size={26} />
        </div>
        <h1 className="text-2xl font-bold">Le Coach IA est réservé aux membres Premium</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-500">
          Posez vos questions à un coach disponible 24h/24 : comment démarrer une conversation,
          relancer un match, préparer un premier rendez-vous en toute sécurité.
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-2.5 text-left text-sm text-gray-600">
          {[
            'Conseils personnalisés, en français',
            'Idées de rendez-vous adaptées à votre ville',
            'Rappels de sécurité avant une rencontre',
            'Likes illimités et « qui vous a aimé »',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-brand" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={() => router.push('/premium')}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-lg shadow-brand/25 transition hover:opacity-90"
        >
          <Crown size={17} /> Passer Premium
        </button>
        <p className="mt-3 text-xs text-gray-400">À partir de 2 500 FCFA / mois</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-2xl flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="text-brand" size={22} /> Coach IA
        </h1>
        <p className="text-sm text-gray-500">
          Conseils de rencontre, messages et sécurité — posez votre question.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-card border border-gray-100 bg-white p-4">
        {turns.length === 0 && (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-gray-400">Par où commencer ?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-xs text-brand hover:opacity-80"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                t.role === 'user' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-gray-100'
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-sm text-gray-400">
              Le coach réfléchit…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Posez votre question au coach…"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={!draft.trim() || ask.isPending}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {ask.isPending ? <Spinner size={16} /> : <Send size={16} />} Envoyer
        </button>
      </form>
    </div>
  );
}
