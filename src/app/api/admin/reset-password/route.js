import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminByEmail, getValidPasswordReset, deletePasswordReset, updateAdmin } from '@/lib/admin';

export async function POST(request) {
  try {
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

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
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
    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
