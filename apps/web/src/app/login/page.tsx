'use client';

import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <LogoMark size={84} />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-brand-ink">Unika</span>
            <span className="text-brand">Love</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">L&apos;amour n&apos;a pas de frontières</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
            placeholder="Mot de passe"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-brand">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
