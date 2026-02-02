import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const role = body.role === 'guest' ? 'guest' : 'student';
    const user = await createUser({
      email: email.trim(),
      password: password || null,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
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
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
