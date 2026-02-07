import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)'],
};
