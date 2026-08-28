'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>;
  }
  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      {/*
        Mobile puts a fixed 56px bar above the content, so the pane starts below
        it and scrolls the window; from md up the rail is beside it and the pane
        owns its own scroll.
      */}
      <main className="min-w-0 flex-1 px-4 pb-10 pt-[72px] md:h-screen md:overflow-y-auto md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
