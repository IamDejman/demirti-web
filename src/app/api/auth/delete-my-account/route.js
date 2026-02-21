import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromRequest, deleteAllUserSessions } from '@/lib/auth';
import { ensureLmsSchema } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : '';
    const normalizedUserEmail = (user.email || '').toLowerCase().trim();

    if (confirmEmail !== normalizedUserEmail) {
      return NextResponse.json(
        { error: 'Email confirmation does not match. Enter your current email to confirm.' },
        { status: 400 }
      );
    }

    await ensureLmsSchema();
    const deletedEmail = `deleted-${user.id}@deleted.local`;

    await sql`
      UPDATE users
      SET
        email = ${deletedEmail},
        password_hash = NULL,
        first_name = NULL,
        last_name = NULL,
        profile_picture_url = NULL,
        bio = NULL,
        phone = NULL,
        address = NULL,
        is_active = false,
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    await deleteAllUserSessions(user.id);

    const res = NextResponse.json({ success: true, message: 'Account deleted' });
    res.cookies.set('lms_token', '', { path: '/', maxAge: 0 });
    return res;
  } catch (e) {
    reportError(e, { route: 'POST /api/auth/delete-my-account' });
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
