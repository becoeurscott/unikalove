const STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  SUSPENDED: 'bg-amber-50 text-amber-700',
  BANNED: 'bg-red-50 text-red-700',
  DELETED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-amber-50 text-amber-700',
  REVIEWING: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  DISMISSED: 'bg-gray-100 text-gray-500',
  FREE: 'bg-gray-100 text-gray-600',
  PREMIUM: 'bg-brand-soft text-brand',
  PREMIUM_PLUS: 'bg-brand-soft text-brand',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[value] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {value.replace('_', ' ')}
    </span>
  );
}
