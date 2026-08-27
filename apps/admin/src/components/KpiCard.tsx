'use client';

import { TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CountUp, HoverCard } from './Motion';

export function KpiCard({
  label,
  value,
  prefix = '',
  delta,
  Icon,
  tint,
  color,
}: {
  label: string;
  value: number | null;
  prefix?: string;
  delta?: string;
  Icon: LucideIcon;
  tint: string;
  color: string;
}) {
  return (
    <HoverCard className="flex items-center gap-4 rounded-card border border-gray-100 bg-white p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: tint, color }}
      >
        <Icon size={22} />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold">
          {value === null ? '—' : <CountUp value={value} prefix={prefix} />}
        </div>
        {delta && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp size={12} /> {delta} vs last week
          </div>
        )}
      </div>
    </HoverCard>
  );
}
