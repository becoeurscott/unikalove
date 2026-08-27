'use client';

import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
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
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream p-4">
      <motion.div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-gold/15 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-card bg-white p-8 shadow-xl shadow-brand/5"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
            className="mb-2 flex justify-center"
          >
            <LogoMark size={92} />
          </motion.div>
          <h1 className="text-2xl font-bold">
            <span className="text-brand-ink">Unika</span>
            <span className="text-brand">Love</span>
            <span className="ml-2 text-sm font-medium text-gray-400">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Connecter les cœurs, célébrer l&apos;amour</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                placeholder="admin@unikalove.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white shadow-lg shadow-brand/25 transition disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
