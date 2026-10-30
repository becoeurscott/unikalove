import { createClient } from '@insforge/sdk';

/**
 * InsForge is the identity provider once NEXT_PUBLIC_INSFORGE_URL is set.
 * Until then the app keeps the legacy NestJS email/password flow, so the
 * cutover is a config change, not a deploy of new code.
 */
export const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? '';
export const insforgeEnabled = INSFORGE_URL !== '';

export const insforge = createClient({
  baseUrl: INSFORGE_URL || 'http://localhost:7130',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});

/** Absolute URL on this app, for OAuth and email-link redirects. */
export function appUrl(path: string): string {
  return typeof window === 'undefined' ? path : window.location.origin + path;
}
