import { NextResponse } from 'next/server';
import { getUserFromRequest, updateUserPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!user.must_change_password) {
      return NextResponse.json(
        { error: 'Password change is not required for your account' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password are required' },
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

    await updateUserPassword(user.id, newPassword);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Change password error:', e);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
