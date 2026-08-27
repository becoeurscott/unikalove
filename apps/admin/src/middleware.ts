import { NextRequest, NextResponse } from 'next/server';

/**
 * Host lock: once ADMIN_ALLOWED_HOSTS is set, the app answers only on those
 * hostnames. Requests to the default *.vercel.app URL get a 404, so the admin
 * is reachable solely through the canonical domain.
 * Leave the variable unset to allow any host (development / pre-domain).
 */
const allowed = (process.env.ADMIN_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function middleware(req: NextRequest) {
  if (allowed.length === 0) return NextResponse.next();

  const host = (req.headers.get('host') ?? '').toLowerCase().split(':')[0];
  if (allowed.includes(host)) {
    const res = NextResponse.next();
    // Defence in depth for anything that ignores the robots file.
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  }
  return new NextResponse('Not found', { status: 404 });
}

export const config = {
  // Run on every route except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
