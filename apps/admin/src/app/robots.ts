import type { MetadataRoute } from 'next';

/** Block every crawler — the admin panel must not be indexed. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
