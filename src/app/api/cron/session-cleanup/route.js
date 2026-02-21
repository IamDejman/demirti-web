import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSessions = await sql`
      DELETE FROM user_sessions WHERE expires_at < NOW() RETURNING id;
    `;

    const adminSessions = await sql`
      DELETE FROM admin_sessions WHERE expires_at < NOW() RETURNING id;
    `;

    const passwordResets = await sql`
      DELETE FROM user_password_resets WHERE expires_at < NOW() RETURNING id;
    `;

    return NextResponse.json({
      cleaned: {
        user_sessions: userSessions.rowCount,
        admin_sessions: adminSessions.rowCount,
        password_resets: passwordResets.rowCount,
      },
    });
  } catch (error) {
    reportError(error, { route: 'GET /api/cron/session-cleanup' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
