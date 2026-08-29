'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { warmUpApi } from '@/lib/api';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const OAUTH = [
  { label: 'Continuer avec Google', classes: 'border border-gray-200 bg-white text-gray-700' },
  { label: 'Continuer avec Facebook', classes: 'bg-[#1877F2] text-white' },
  { label: 'Continuer avec Apple', classes: 'bg-black text-white' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Start waking the API while the form is being filled in, so submitting does
  // not pay for the cold start.
  useEffect(() => warmUpApi(), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(email, password);
      // The landing CTAs pass ?plan=...; stash it so onboarding can finish on
      // /premium instead of dropping the user on the dashboard.
      try {
        const plan = new URLSearchParams(window.location.search).get('plan');
        if (plan === 'PREMIUM' || plan === 'PREMIUM_PLUS') {
          sessionStorage.setItem('unika_intended_plan', plan);
        }
      } catch {
        /* storage unavailable — just skip the upsell redirect */
      }
      router.push('/onboarding');
      // Deliberately leave the overlay up: the push is async and the wizard
      // does its own fetch, so clearing here would flash the form back.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <LoadingOverlay show={busy} title="Création de votre compte…" />
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <LogoMark size={84} />
          </div>
          <h1 className="text-xl font-bold text-brand">Commencez votre histoire</h1>
          <p className="mt-1 text-sm text-gray-500">Inscrivez-vous gratuitement</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
            placeholder="E-mail"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
            placeholder="Mot de passe (8 caractères min.)"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Mail size={16} />
            {busy ? 'Inscription…' : "S'inscrire avec e-mail"}
          </button>
        </form>
        <div className="mt-3 space-y-2">
          {OAUTH.map((o) => (
            <button
              key={o.label}
              disabled
              title="Bientôt disponible"
              className={`w-full rounded-lg py-2.5 text-sm font-medium opacity-60 ${o.classes}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-brand">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
