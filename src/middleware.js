import { NextResponse } from 'next/server';

export async function middleware(request) {
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
  const lmsToken = request.cookies.get('lms_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;

  // Student / facilitator dashboard: require LMS cookie (or client will redirect via layout)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/facilitator')) {
    if (!lmsToken) {
      const login = new URL('/login', request.url);
      return NextResponse.redirect(login);
    }
  }

  // Admin: optional cookie check (admin often uses localStorage; layout handles redirect)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/forgot-password')) {
    if (!adminToken && !lmsToken) {
      // No cookie - let client layout handle redirect if they use localStorage
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)'],
};
