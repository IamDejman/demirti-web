import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { verifyAdminCredentials, createAdminSession } from '@/lib/admin';
import { rateLimit, getLoginBackoff, recordLoginFailure, clearLoginFailures } from '@/lib/rateLimit';
import { recordAuditLog } from '@/lib/audit';
import { getAdminMfa, createMfaChallenge } from '@/lib/mfa';

// POST - Admin login
export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_login_${ip}`, { windowMs: 60_000, limit: 8 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Per-email rate limit
    const emailLimiter = await rateLimit(`admin_login_email_${normalizedEmail}`, { windowMs: 60_000, limit: 5 });
    if (!emailLimiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    // Exponential backoff on repeated failures
    const backoff = await getLoginBackoff(`admin_login_${normalizedEmail}`);
    if (!backoff.allowed) {
      const retryAfter = Math.ceil(backoff.retryAfterMs / 1000);
      const res = NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
      res.headers.set('Retry-After', String(retryAfter));
      return res;
    }

    const admin = await verifyAdminCredentials(normalizedEmail, password);

    if (!admin) {
      await recordLoginFailure(`admin_login_${normalizedEmail}`);
      recordAuditLog({
        userId: null,
        action: 'admin.login_failed',
        targetType: 'admin',
        details: { reason: 'invalid_credentials' },
        ipAddress: ip,
        actorEmail: normalizedEmail,
      }).catch(() => {});
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await clearLoginFailures(`admin_login_${normalizedEmail}`);

    // Check if MFA is enabled
    let mfa = null;
    try { mfa = await getAdminMfa(admin.id); } catch { /* MFA table may not exist yet */ }

    if (mfa && mfa.is_enabled) {
      // Credentials valid, but MFA required — issue a short-lived challenge token
      const mfaToken = await createMfaChallenge(admin.id, ip);
      return NextResponse.json({ requiresMfa: true, mfaToken });
    }

    // No MFA — create session directly
    const token = crypto.randomBytes(32).toString('hex');
    await createAdminSession(admin.id, token);

    recordAuditLog({
      userId: null,
      action: 'admin.login',
      targetType: 'admin',
      targetId: String(admin.id),
      details: {},
      ipAddress: ip,
      actorEmail: admin.email,
    }).catch(() => {});

    const res = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      message: 'Login successful',
    });
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    reportError(error, { route: 'POST /api/admin/login' });
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
