import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { createAdminSession } from '@/lib/admin';
import { peekMfaChallenge, consumeMfaChallenge, getAdminMfa, verifyTotp } from '@/lib/mfa';
import { rateLimit } from '@/lib/rateLimit';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_mfa_verify_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json();
    const { mfaToken, code } = body || {};

    if (!mfaToken || typeof mfaToken !== 'string') {
      return NextResponse.json({ error: 'MFA session expired. Please login again.', code: 'MFA_EXPIRED' }, { status: 401 });
    }
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'A 6-digit code is required' }, { status: 400 });
    }

    // Peek at challenge first (don't consume yet) — verify IP binding
    const adminId = await peekMfaChallenge(mfaToken, ip);
    if (!adminId) {
      return NextResponse.json({ error: 'MFA session expired. Please login again.', code: 'MFA_EXPIRED' }, { status: 401 });
    }

    const mfa = await getAdminMfa(adminId);
    if (!mfa || !mfa.is_enabled) {
      return NextResponse.json({ error: 'MFA is not configured' }, { status: 400 });
    }

    if (!verifyTotp(mfa.secret, code)) {
      recordAuditLog({
        userId: null,
        action: 'admin.mfa_verify_failed',
        targetType: 'admin',
        targetId: String(adminId),
        details: { reason: 'invalid_totp' },
        ipAddress: ip,
      }).catch(() => {});
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
    }

    // TOTP verified — now consume the challenge
    const consumed = await consumeMfaChallenge(mfaToken);
    if (!consumed) {
      // Race condition: another request already consumed it
      return NextResponse.json({ error: 'MFA session expired. Please login again.', code: 'MFA_EXPIRED' }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await createAdminSession(adminId, token);

    recordAuditLog({
      userId: null,
      action: 'admin.login_mfa',
      targetType: 'admin',
      targetId: String(adminId),
      details: {},
      ipAddress: ip,
    }).catch(() => {});

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/mfa/verify-login' });
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
