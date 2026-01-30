import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getAdminByEmail, createPasswordReset, deletePasswordReset } from '@/lib/admin';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const admin = await getAdminByEmail(email);
    if (!admin || !admin.is_active) {
      return NextResponse.json({ success: true });
    }

    await deletePasswordReset(email);

    const otp = crypto.randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await createPasswordReset(email, otp, expiresAt);

    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
        await resend.emails.send({
          from: `CVERSE Admin <${fromEmail}>`,
          to: email,
          subject: 'Your password reset code',
          html: `
          <p>Use this code to reset your admin password:</p>
          <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.2em;">${otp}</p>
          <p>It expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
        `,
        });
      } catch (emailError) {
        console.error('Forgot password: email send failed', emailError);
        // OTP is already stored; still return success so user can contact support for code
      }
    }

    const payload = { success: true };
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      payload.devOtp = otp;
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
