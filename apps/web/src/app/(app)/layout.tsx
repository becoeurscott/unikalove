'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageTransition } from '@/components/Motion';
import { Sidebar } from '@/components/Sidebar';
import { LoadingScreen } from '@/components/Spinner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api('/profiles/me'),
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile.error instanceof ApiError && profile.error.status === 404) {
      router.replace('/onboarding');
    }
  }, [profile.error, router]);

  if (loading || (user && profile.isLoading)) {
    return <LoadingScreen />;
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
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
