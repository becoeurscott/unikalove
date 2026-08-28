'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { FadeIn } from '@/components/Motion';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
  profile: { displayName: string; verified: boolean; city: string | null } | null;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', query],
    queryFn: () =>
      api<AdminUserRow[]>(`/admin/users${query ? `?search=${encodeURIComponent(query)}` : ''}`),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500">Manage platform accounts</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-64 rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            Search
          </button>
        </form>
      </FadeIn>

      <FadeIn delay={2} className="overflow-x-auto rounded-card border border-gray-100 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">City</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3 font-medium">
                  {u.profile?.displayName ?? '—'}
                  {u.profile?.verified && <span className="ml-1 text-blue-500">✓</span>}
                </td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3 text-gray-500">{u.profile?.city ?? '—'}</td>
                <td className="px-5 py-3">
                  <StatusBadge value={u.plan} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge value={u.status} />
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="space-x-2 px-5 py-3">
                  {u.status === 'ACTIVE' ? (
                    <>
                      <button
                        onClick={() => setStatus.mutate({ id: u.id, status: 'SUSPENDED' })}
                        className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-50"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => setStatus.mutate({ id: u.id, status: 'BANNED' })}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Ban
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setStatus.mutate({ id: u.id, status: 'ACTIVE' })}
                      className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FadeIn>
    </div>
  );
}
