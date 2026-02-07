import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { ensureLmsSchema } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';

/**
 * Dev-only: runs init-db server-side so visiting /api/init-db-run from localhost works.
 * Uses CRON_SECRET from env (no need to pass header).
 */
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev || !isLocalhost) {
    return NextResponse.json({ error: 'Only available on localhost in development' }, { status: 403 });
  }

  try {
    await sql`SELECT 1 as test`;
    logger.info('Database connection successful');
  } catch (connError) {
    logger.error('Database connection error', { hint: connError?.message });
    return NextResponse.json(
      { error: 'Database connection failed', details: connError.message },
      { status: 500 }
    );
  }

  try {
    await initializeDatabase();
    let lmsOk = false;
    let lmsError = null;
    try {
      await ensureLmsSchema();
      lmsOk = true;
    } catch (lmsErr) {
      logger.warn('LMS schema init skipped or failed', { message: lmsErr.message });
      lmsError = lmsErr.message;
    }

    const tablesCheck = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('tracks', 'applications', 'admins', 'users', 'cohorts')
      ORDER BY table_name;
    `;

    return NextResponse.json({
      success: true,
      message: 'Database initialized',
      lmsOk,
      lmsError: lmsError || undefined,
      tables: tablesCheck.rows.map((r) => r.table_name),
    });
  } catch (e) {
    logger.error('init-db-run failed', { message: e.message });
    return NextResponse.json({ error: 'Initialization failed', details: e.message }, { status: 500 });
  }
}
