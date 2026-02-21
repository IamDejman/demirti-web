import { NextResponse } from 'next/server';
import { ensureLmsSchema } from '@/lib/db-lms';
import { logger } from '@/lib/logger';

/**
 * Initialize LMS schema (users, cohorts, weeks, assignments, etc.).
 * Safe to call multiple times; creates tables only if missing.
 * Requires CRON_SECRET Bearer token.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureLmsSchema();
    return NextResponse.json({
      success: true,
      message: 'LMS schema initialized or already present',
    });
  } catch (error) {
    logger.error('LMS init error', { message: error?.message });
    return NextResponse.json({ error: 'Failed to initialize LMS schema' }, { status: 500 });
  }
}
