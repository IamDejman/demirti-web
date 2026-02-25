import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { getUserFromRequest, updateUserPassword, deleteAllUserSessions, createUserSession, generateSessionToken } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import { rateLimit } from '@/lib/rateLimit';
import { validateBody, forcedChangePasswordSchema } from '@/lib/schemas';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`auth_change_pw_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!user.must_change_password) {
      return NextResponse.json(
        { error: 'Password change is not required for your account' },
        { status: 403 }
      );
    }

    const [data, validationErr] = await validateBody(request, forcedChangePasswordSchema);
    if (validationErr) return validationErr;
    const { newPassword, confirmPassword } = data;

    if (confirmPassword != null && confirmPassword !== '' && newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirm password do not match' }, { status: 400 });
    }

    const pw = validatePassword(newPassword);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.message }, { status: 400 });
    }

    await updateUserPassword(user.id, newPassword);
    await deleteAllUserSessions(user.id);
    const token = generateSessionToken();
    await createUserSession(user.id, token);
    recordAuditLog({
      userId: user.id,
      action: 'user.password_changed',
      targetType: 'user',
      targetId: user.id,
      details: { type: 'forced_change' },
      ipAddress: ip,
      actorEmail: user.email,
    }).catch(() => {});
    const res = NextResponse.json({ success: true });
    res.cookies.set('lms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    reportError(e, { route: 'POST /api/auth/change-password' });
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
