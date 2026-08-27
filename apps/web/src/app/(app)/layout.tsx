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
      <main className="h-screen flex-1 overflow-y-auto p-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
