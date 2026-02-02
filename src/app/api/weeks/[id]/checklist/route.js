import { NextResponse } from 'next/server';
import { getWeekById, getChecklistItemsByWeek, createChecklistItem, getCohortFacilitators } from '@/lib/db-lms';
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
    if (!id) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isStudent = await isStudentInCohort(week.cohort_id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const checklistItems = await getChecklistItemsByWeek(id);
    return NextResponse.json({ checklistItems });
  } catch (e) {
    console.error('GET /api/weeks/[id]/checklist:', e);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { title, orderIndex, isRequired } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    const item = await createChecklistItem({
      weekId: id,
      title: title.trim(),
      orderIndex: orderIndex ?? 0,
      isRequired: isRequired ?? true,
    });
    return NextResponse.json({ checklistItem: item });
  } catch (e) {
    console.error('POST /api/weeks/[id]/checklist:', e);
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
}
