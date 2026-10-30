'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { insforgeEnabled } from '@/lib/insforge';

/** Disabled with a hint until InsForge (which hosts the Google OAuth app) is configured. */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Connexion Google impossible');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!insforgeEnabled || busy}
      title={insforgeEnabled ? undefined : 'Bientôt disponible'}
      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
    >
      {busy ? 'Redirection…' : 'Continuer avec Google'}
    </button>
  );
}
