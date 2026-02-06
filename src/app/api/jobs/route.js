import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
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

    const result = await sql`
      SELECT j.*, t.track_name
      FROM jobs j
      LEFT JOIN tracks t ON t.id = j.track_id
      WHERE j.is_active = true
        ${trackId ? sql`AND j.track_id = ${parseInt(trackId, 10)}` : sql``}
        ${q ? sql`AND (j.title ILIKE ${`%${q}%`} OR j.company ILIKE ${`%${q}%`})` : sql``}
      ORDER BY j.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;
    return NextResponse.json({ jobs: result.rows });
  } catch (e) {
    console.error('GET /api/jobs:', e);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
