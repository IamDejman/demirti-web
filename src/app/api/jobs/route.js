import { NextResponse } from 'next/server';
import { sqlRead } from '@/lib/db-read';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
  try {
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);
    const trackId = searchParams.get('trackId');
    const q = (searchParams.get('q') || '').trim();

    const result = await sqlRead`
      SELECT j.*, t.track_name
      FROM jobs j
      LEFT JOIN tracks t ON t.id = j.track_id
      WHERE j.is_active = true
        ${trackId ? sqlRead`AND j.track_id = ${parseInt(trackId, 10)}` : sqlRead``}
        ${q ? sqlRead`AND (j.title ILIKE ${`%${q}%`} OR j.company ILIKE ${`%${q}%`})` : sqlRead``}
      ORDER BY j.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;
    return NextResponse.json({ jobs: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/jobs' });
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
