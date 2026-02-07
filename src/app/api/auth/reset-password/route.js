import { NextResponse } from 'next/server';
import { getValidUserPasswordReset, deleteUserPasswordReset, updateUserPassword, createUserSession, generateSessionToken } from '@/lib/auth';
import { getUserByEmail } from '@/lib/auth';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword, confirmPassword } = body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, code, new password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const resetRow = await getValidUserPasswordReset(normalizedEmail, String(otp).trim());
    if (!resetRow) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 400 }
      );
    }

    await updateUserPassword(user.id, newPassword);
    await deleteUserPasswordReset(normalizedEmail);

    const token = generateSessionToken();
    await createUserSession(user.id, token);

    const res = NextResponse.json({
      success: true,
      token,
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
    console.error('Reset password error:', error?.message || error);
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
