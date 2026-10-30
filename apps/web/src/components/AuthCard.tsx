import { LogoMark } from '@/components/Logo';

/** Shell shared by the password-recovery screens; mirrors the login card. */
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <LogoMark size={64} />
          </div>
          <h1 className="text-xl font-bold text-brand-ink">{title}</h1>
        </div>
        {children}
      </div>
    </main>
  );
}

export const inputClass =
  'w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand';
export const submitClass =
  'w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50';
