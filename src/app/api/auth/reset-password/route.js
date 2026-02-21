import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { getValidUserPasswordReset, deleteUserPasswordReset, updateUserPassword, createUserSession, generateSessionToken, deleteAllUserSessions } from '@/lib/auth';
import { getUserByEmail } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import { rateLimit } from '@/lib/rateLimit';
import { validateBody, resetPasswordSchema } from '@/lib/schemas';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`auth_reset_pw_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const [data, validationErr] = await validateBody(request, resetPasswordSchema);
    if (validationErr) return validationErr;
    const { email, otp, newPassword } = data;
    const normalizedEmail = email;

    const pw = validatePassword(newPassword);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.message }, { status: 400 });
    }

    const [resetRow, user] = await Promise.all([
      getValidUserPasswordReset(normalizedEmail, String(otp).trim()),
      getUserByEmail(normalizedEmail),
    ]);
    if (!resetRow) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 400 }
      );
    }

    await updateUserPassword(user.id, newPassword);
    await deleteAllUserSessions(user.id);

    const token = generateSessionToken();
    await Promise.all([
      deleteUserPasswordReset(normalizedEmail),
      createUserSession(user.id, token),
    ]);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
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
  } catch (error) {
    reportError(error, { route: 'POST /api/auth/reset-password' });
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
