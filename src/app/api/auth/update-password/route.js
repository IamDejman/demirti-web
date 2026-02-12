import { NextResponse } from 'next/server';
import {
  getUserFromRequest,
  getPasswordHashByUserId,
  verifyPassword,
  updateUserPassword,
} from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirm password are required' },
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
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const hash = await getPasswordHashByUserId(user.id);
    if (!hash || !(await verifyPassword(currentPassword, hash))) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    await updateUserPassword(user.id, newPassword);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Update password error:', e);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
