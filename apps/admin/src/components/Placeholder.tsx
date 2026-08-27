'use client';

import { Construction } from 'lucide-react';
import { FadeIn } from './Motion';

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">{title}</h1>
      </FadeIn>
      <FadeIn delay={1}>
        <div className="flex h-64 items-center justify-center rounded-card border border-dashed border-gray-200 bg-white">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Construction size={22} />
            </div>
            <p className="text-sm text-gray-500">{note}</p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
