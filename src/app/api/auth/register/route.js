import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { validatePassword } from '@/lib/passwordPolicy';
import { getClientIp } from '@/lib/api-helpers';
import { registerSchema, validateBody } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`auth_register_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const [data, validationErr] = await validateBody(request, registerSchema);
    if (validationErr) return validationErr;
    const { email, password, firstName, lastName } = data;
    const role = 'student';
    const passwordValue = password || null;
    if (passwordValue) {
      const pw = validatePassword(passwordValue);
      if (!pw.valid) {
        return NextResponse.json({ error: pw.message }, { status: 400 });
      }
    }
    const user = await createUser({
      email,
      password: passwordValue,
      firstName: firstName || null,
      lastName: lastName || null,
      role,
    });
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        referralCode: user.referral_code,
      },
    });
  } catch (e) {
    if (e.message === 'An account with this email already exists') {
      return NextResponse.json({ error: 'Registration failed. If you already have an account, try logging in.' }, { status: 409 });
    }
    reportError(e, { route: 'POST /api/auth/register' });
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
