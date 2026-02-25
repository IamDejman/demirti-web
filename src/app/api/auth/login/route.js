import { NextResponse } from 'next/server';
import { verifyUserCredentials, createUserSession, generateSessionToken } from '@/lib/auth';
import { rateLimit, getLoginBackoff, recordLoginFailure, clearLoginFailures } from '@/lib/rateLimit';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/api-helpers';
import { loginSchema, validateBody } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`auth_login_${ip}`, { windowMs: 60_000, limit: 10 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }
    const [data, validationErr] = await validateBody(request, loginSchema);
    if (validationErr) return validationErr;
    const { email, password } = data;

    // Per-email rate limit
    const emailLimiter = await rateLimit(`auth_login_email_${email}`, { windowMs: 60_000, limit: 5 });
    if (!emailLimiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    // Exponential backoff on repeated failures
    const backoff = await getLoginBackoff(`login_${email}`);
    if (!backoff.allowed) {
      const retryAfter = Math.ceil(backoff.retryAfterMs / 1000);
      const res = NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
      res.headers.set('Retry-After', String(retryAfter));
      return res;
    }

    const user = await verifyUserCredentials(email, password);
    if (!user) {
      await recordLoginFailure(`login_${email}`);
      recordAuditLog({
        action: 'user.login_failed',
        targetType: 'user',
        details: { reason: 'invalid_credentials' },
        ipAddress: ip,
        actorEmail: email,
      }).catch(() => {});
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await clearLoginFailures(`login_${email}`);
    const token = generateSessionToken();
    await Promise.all([
      createUserSession(user.id, token),
      recordAuditLog({
        userId: user.id,
        action: 'user.login',
        targetType: 'user',
        targetId: user.id,
        details: { role: user.role },
        ipAddress: ip,
        actorEmail: user.email,
      }),
    ]);
    const res = NextResponse.json({
      success: true,
      mustChangePassword: user.mustChangePassword,
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
    reportError(e, { route: 'POST /api/auth/login' });
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
