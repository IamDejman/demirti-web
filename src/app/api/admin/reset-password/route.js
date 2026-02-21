import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { ensureDatabaseInitialized } from '@/lib/db';
import { getAdminByEmail, getValidPasswordReset, deletePasswordReset, updateAdmin, createAdminSession } from '@/lib/admin';
import { validatePassword } from '@/lib/passwordPolicy';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_reset_pw_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    await ensureDatabaseInitialized();

    const body = await request.json();
    const { email, otp, newPassword, confirmPassword } = body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, new password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password do not match' },
        { status: 400 }
      );
    }

    const pw = validatePassword(newPassword);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.message }, { status: 400 });
    }

    const resetRow = await getValidPasswordReset(normalizedEmail, String(otp).trim());
    if (!resetRow) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      );
    }

    const admin = await getAdminByEmail(normalizedEmail);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 400 }
      );
    }

    await updateAdmin(admin.id, { password: newPassword });
    await deletePasswordReset(normalizedEmail);

    const token = crypto.randomBytes(32).toString('hex');
    await createAdminSession(admin.id, token);
    const res = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
      },
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
    reportError(error, { route: 'POST /api/admin/reset-password' });
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return NextResponse.json(
        { error: 'Service is updating. Please request a new code and try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
