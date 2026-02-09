import { NextResponse } from 'next/server';
import { sqlRead } from '@/lib/db-read';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
  try {
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const trackId = searchParams.get('trackId');
    const result = await sqlRead`
      SELECT p.*, t.track_name
      FROM sample_projects p
      LEFT JOIN tracks t ON t.id = p.track_id
      WHERE p.is_active = true
        ${trackId ? sqlRead`AND p.track_id = ${parseInt(trackId, 10)}` : sqlRead``}
      ORDER BY p.created_at DESC
      LIMIT ${limit};
    `;
    return NextResponse.json({ projects: result.rows });
  } catch (e) {
    console.error('GET /api/sample-projects:', e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
