import { NextResponse } from 'next/server';
import { getAssignmentById, getSubmissionByAssignmentAndStudent } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function isStudentInCohort(cohortId, studentId) {
  await ensureLmsSchema();
  const r = await sql`SELECT 1 FROM cohort_students WHERE cohort_id = ${cohortId} AND student_id = ${studentId} LIMIT 1`;
  return r.rows.length > 0;
}

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const inCohort = await isStudentInCohort(assignment.cohort_id, user.id);
    if (!inCohort) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const submission = await getSubmissionByAssignmentAndStudent(id, user.id);
    return NextResponse.json({ submission: submission || null });
  } catch (e) {
    console.error('GET /api/assignments/[id]/my-submission:', e);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}
