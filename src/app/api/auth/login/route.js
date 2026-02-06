import { NextResponse } from 'next/server';
import { verifyUserCredentials, createUserSession, generateSessionToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const limiter = rateLimit(`auth_login_${ip}`, { windowMs: 60_000, limit: 10 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }
    const body = await request.json();
    const { email, password } = body;
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    const user = await verifyUserCredentials(email.trim(), password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    const token = generateSessionToken();
    await createUserSession(user.id, token);
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    res.cookies.set('lms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    if (e.message === 'Account is disabled') {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
