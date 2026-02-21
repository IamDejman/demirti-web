import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { getCohortIdsForUser } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    if (!q || q.length < 2) return NextResponse.json({ users: [] });

    const cohortIds = await getCohortIdsForUser(user.id, user.role);
    if (cohortIds.length === 0) return NextResponse.json({ users: [] });

    const result = await sql`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      LEFT JOIN cohort_students cs ON cs.student_id = u.id
      LEFT JOIN cohort_facilitators cf ON cf.facilitator_id = u.id
      WHERE (cs.cohort_id = ANY(${cohortIds}) OR cf.cohort_id = ANY(${cohortIds}))
        AND u.id <> ${user.id}
        AND (
          LOWER(u.email) LIKE ${'%' + q + '%'} OR
          LOWER(u.first_name) LIKE ${'%' + q + '%'} OR
          LOWER(u.last_name) LIKE ${'%' + q + '%'}
        )
      ORDER BY u.first_name NULLS LAST
      LIMIT 10;
    `;
    return NextResponse.json({ users: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/chat/users' });
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
