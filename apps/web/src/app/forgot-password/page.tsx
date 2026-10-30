'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthCard, inputClass, submitClass } from '@/components/AuthCard';
import { appUrl, insforge } from '@/lib/insforge';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: appUrl('/reset-password'),
    });
    setBusy(false);
    // Same confirmation whether or not the account exists — no enumeration.
    if (err && err.statusCode !== 404) setError("L'envoi a échoué, réessayez.");
    else setSent(true);
  }

  return (
    <AuthCard title="Mot de passe oublié">
      {sent ? (
        <p className="text-center text-sm text-gray-600">
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient
          d&apos;être envoyé. Pensez à vérifier vos spams.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            Entrez votre e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="E-mail"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={submitClass}>
            {busy ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}
