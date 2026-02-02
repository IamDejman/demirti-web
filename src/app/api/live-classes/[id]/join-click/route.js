import { NextResponse } from 'next/server';
import { getLiveClassById, upsertAttendanceJoinClick } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function isStudentInCohort(cohortId, studentId) {
  await ensureLmsSchema();
  const r = await sql`SELECT 1 FROM cohort_students WHERE cohort_id = ${cohortId} AND student_id = ${studentId} LIMIT 1`;
  return r.rows.length > 0;
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Only students can record join click' }, { status: 403 });
    }
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const inCohort = await isStudentInCohort(liveClass.cohort_id, user.id);
    if (!inCohort) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await upsertAttendanceJoinClick(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/live-classes/[id]/join-click:', e);
    return NextResponse.json({ error: 'Failed to record join' }, { status: 500 });
  }
}
