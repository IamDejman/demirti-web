import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const result = await sql`
      SELECT c.*, co.name AS cohort_name, t.track_name
      FROM certificates c
      LEFT JOIN cohorts co ON co.id = c.cohort_id
      LEFT JOIN tracks t ON t.id = co.track_id
      WHERE c.user_id = ${user.id}
      ORDER BY c.issued_at DESC;
    `;
    return NextResponse.json({ certificates: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/certificates' });
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
