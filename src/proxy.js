import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Centralized cron auth -- reject unauthorized cron requests early
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const rawHost = request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  let baseDomain = '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  try {
    if (baseUrl) baseDomain = new URL(baseUrl).host;
  } catch {
    baseDomain = '';
  }
  if (!baseDomain) baseDomain = process.env.BASE_DOMAIN || '';
  const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
  const isBaseDomain = baseDomain && (host === baseDomain || host.endsWith(`.${baseDomain}`));

  if (!isLocal && !isBaseDomain && pathname === '/') {
    const lookupUrl = new URL(`/api/portfolio/resolve-domain?host=${encodeURIComponent(host)}`, request.url);
    try {
      const res = await fetch(lookupUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.slug) {
          const rewriteUrl = request.nextUrl.clone();
          rewriteUrl.pathname = `/portfolio/${data.slug}`;
          return NextResponse.rewrite(rewriteUrl);
        }
      }
    } catch {
      // ignore lookup failures
    }
  }

  const response = NextResponse.next();

  response.headers.set('x-request-id', crypto.randomUUID());

  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sw.js|manifest.webmanifest).*)'],
};
