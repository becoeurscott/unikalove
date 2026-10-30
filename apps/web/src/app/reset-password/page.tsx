'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthCard, inputClass, submitClass } from '@/components/AuthCard';
import { insforge } from '@/lib/insforge';

/**
 * Landing page of the emailed link. InsForge validates the link first and
 * redirects here with ?token=…&insforge_status=ready (or =error).
 */
function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const ready = params.get('insforge_status') !== 'error' && !!token;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas');
    if (password.length < 8) return setError('8 caractères minimum');
    setError('');
    setBusy(true);
    const { error: err } = await insforge.auth.resetPassword({ newPassword: password, otp: token! });
    if (err) {
      setError(err.message ?? 'Lien expiré, recommencez.');
      setBusy(false);
      return;
    }
    router.push('/login?reset=1');
  }

  if (!ready) {
    return (
      <p className="text-center text-sm text-gray-600">
        Ce lien est invalide ou a expiré.{' '}
        <Link href="/forgot-password" className="font-semibold text-brand">
          Demander un nouveau lien
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
        placeholder="Nouveau mot de passe (8 caractères min.)"
      />
      <input
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
        placeholder="Confirmer le mot de passe"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={submitClass}>
        {busy ? 'Enregistrement…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
