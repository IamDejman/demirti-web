import { NextResponse } from 'next/server';
import { getValidUserPasswordReset } from '@/lib/auth';
import { reportError } from '@/lib/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const otp = (body.otp || '').trim();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const resetRow = await getValidUserPasswordReset(email, otp);
    if (!resetRow) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'POST /api/auth/verify-reset-otp' });
    return NextResponse.json(
      { error: 'Something went wrong. Try again later.' },
      { status: 500 }
    );
  }
}
