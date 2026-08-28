'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FadeIn } from '@/components/Motion';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface ReportRow {
  id: string;
  category: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { email: string };
  reported: { id: string; email: string; status: string };
}

interface VerificationRow {
  id: string;
  selfieUrl: string;
  createdAt: string;
  user: { email: string; profile: { displayName: string } | null };
}

export default function ReportsPage() {
  const qc = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => api<ReportRow[]>('/admin/reports'),
  });
  const { data: verifications } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => api<VerificationRow[]>('/admin/verifications'),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/reports/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const reviewVerification = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api(`/admin/verifications/${id}`, { method: 'PATCH', body: { approve } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-verifications'] }),
  });

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-bold">Reports & Moderation</h1>
        <p className="text-sm text-gray-500">User reports and identity verification queue</p>
      </FadeIn>

      <FadeIn delay={1}>
      <section className="rounded-card border border-gray-100 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-4 font-semibold">User Reports</h2>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Reporter</th>
              <th className="px-5 py-3">Reported</th>
              <th className="px-5 py-3">Details</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map((r) => (
              <tr key={r.id} className="border-b border-gray-50 last:border-0 align-top">
                <td className="px-5 py-3 font-medium">{r.category.replace(/_/g, ' ')}</td>
                <td className="px-5 py-3 text-gray-500">{r.reporter.email}</td>
                <td className="px-5 py-3 text-gray-500">{r.reported.email}</td>
                <td className="max-w-xs px-5 py-3 text-gray-500">{r.details ?? '—'}</td>
                <td className="px-5 py-3">
                  <StatusBadge value={r.status} />
                </td>
                <td className="space-x-2 px-5 py-3">
                  {(r.status === 'PENDING' || r.status === 'REVIEWING') && (
                    <>
                      <button
                        onClick={() => resolveReport.mutate({ id: r.id, status: 'RESOLVED' })}
                        className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => resolveReport.mutate({ id: r.id, status: 'DISMISSED' })}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {reports?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No reports — all clear 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
      </FadeIn>

      <FadeIn delay={2}>
      <section className="rounded-card border border-gray-100 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-4 font-semibold">
          Verification Requests
        </h2>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Selfie</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(verifications ?? []).map((v) => (
              <tr key={v.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3 font-medium">
                  {v.user.profile?.displayName ?? v.user.email}
                </td>
                <td className="px-5 py-3">
                  <a href={v.selfieUrl} target="_blank" className="text-brand underline">
                    View selfie
                  </a>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(v.createdAt).toLocaleString()}
                </td>
                <td className="space-x-2 px-5 py-3">
                  <button
                    onClick={() => reviewVerification.mutate({ id: v.id, approve: true })}
                    className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewVerification.mutate({ id: v.id, approve: false })}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {verifications?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  No pending verification requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
      </FadeIn>
    </div>
  );
}
