import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getUserByEmail, createUserPasswordReset, deleteUserPasswordReset } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

export async function POST(request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const limiter = rateLimit(`auth_forgot_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
      return NextResponse.json({ success: true });
    }

    await deleteUserPasswordReset(email);

    const otp = crypto.randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await createUserPasswordReset(email, otp, expiresAt);

    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
        await resend.emails.send({
          from: `CVERSE Academy <${fromEmail}>`,
          to: email,
          subject: 'Your password reset code',
          html: `
          <p>Use this code to reset your CVERSE Academy password:</p>
          <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.2em;">${otp}</p>
          <p>It expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
        `,
        });
      } catch (emailError) {
        console.error('Forgot password: email send failed', emailError);
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
