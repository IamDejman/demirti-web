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

  // Generate CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "frame-src 'self' https://assessments.skilladder.ai",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('x-request-id', crypto.randomUUID());
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sw.js|manifest.webmanifest).*)'],
};
