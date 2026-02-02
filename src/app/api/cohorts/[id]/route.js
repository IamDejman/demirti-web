import { NextResponse } from 'next/server';
import { getCohortById, updateCohort, getCohortFacilitators, ensureLmsSchema } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

async function checkStudentInCohort(cohortId, studentId) {
  await ensureLmsSchema();
  const r = await sql`SELECT 1 FROM cohort_students WHERE cohort_id = ${cohortId} AND student_id = ${studentId} LIMIT 1`;
  return r.rows.length > 0;
}

export async function GET(request, { params }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isAdmin = user.role === 'admin';
    const isStudent = await checkStudentInCohort(id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ cohort: { ...cohort, facilitators } });
  } catch (e) {
    console.error('GET /api/cohorts/[id]:', e);
    return NextResponse.json({ error: 'Failed to fetch cohort' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updated = await updateCohort(id, {
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      currentWeek: body.currentWeek,
      status: body.status,
    });
    return NextResponse.json({ cohort: updated });
  } catch (e) {
    console.error('PUT /api/cohorts/[id]:', e);
    return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
  }
}
