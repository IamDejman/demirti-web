import { NextResponse } from 'next/server';
import { getCohortById, getWeeksByCohort, getCohortFacilitators } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

async function isStudentInCohort(cohortId, studentId) {
  await ensureLmsSchema();
  const r = await sql`SELECT 1 FROM cohort_students WHERE cohort_id = ${cohortId} AND student_id = ${studentId} LIMIT 1`;
  return r.rows.length > 0;
}

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isStudent = await isStudentInCohort(id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const forStudent = (user.role === 'student' || user.role === 'alumni') && isStudent;
    const weeks = await getWeeksByCohort(id, { forStudent });
    return NextResponse.json({ weeks });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/weeks:', e);
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 });
  }
}
