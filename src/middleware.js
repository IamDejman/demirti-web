import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
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
  matcher: ['/dashboard/:path*', '/facilitator/:path*', '/admin/:path*'],
};
