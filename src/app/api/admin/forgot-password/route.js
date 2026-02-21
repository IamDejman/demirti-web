import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { Resend } from 'resend';
import { getAdminByEmail, createPasswordReset, deletePasswordReset } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_forgot_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

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

    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
      const { error } = await resend.emails.send({
        from: `CVERSE Admin <${fromEmail}>`,
        to: email,
        subject: 'Your password reset code',
        html: `
          <p>Use this code to reset your admin password:</p>
          <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.2em;">${otp}</p>
          <p>It expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
        `,
      });
      if (error) {
        reportError(error, { route: 'POST /api/admin/forgot-password' });
      } else {
        emailSent = true;
      }
    }

    const payload = { success: true };
    if (!emailSent && process.env.NODE_ENV === 'development') {
      payload.devOtp = otp;
    }
    return NextResponse.json(payload);
  } catch (error) {
    reportError(error, { route: 'POST /api/admin/forgot-password' });
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
