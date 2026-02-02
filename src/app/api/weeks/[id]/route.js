import { NextResponse } from 'next/server';
import {
  getWeekById,
  getContentItemsByWeek,
  getMaterialsByWeek,
  getChecklistItemsByWeek,
  updateWeek,
  getCohortById,
  getCohortFacilitators,
  getLiveClassByWeekId,
} from '@/lib/db-lms';
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
    const cohort = await getCohortById(week.cohort_id);
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isStudent = await isStudentInCohort(week.cohort_id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((user.role === 'student' || user.role === 'alumni') && week.is_locked && week.unlock_date && new Date(week.unlock_date) > new Date()) {
      return NextResponse.json({ error: 'Week is locked' }, { status: 403 });
    }
    const liveClass = await getLiveClassByWeekId(id);
    const [contentItems, materials, checklistItems] = await Promise.all([
      getContentItemsByWeek(id),
      getMaterialsByWeek(id),
      getChecklistItemsByWeek(id),
    ]);
    return NextResponse.json({
      week: { ...week, cohort, live_class_datetime: liveClass?.scheduled_at ?? week.live_class_datetime, google_meet_link: liveClass?.google_meet_link ?? week.google_meet_link, live_class_id: liveClass?.id },
      contentItems,
      materials,
      checklistItems,
    });
  } catch (e) {
    console.error('GET /api/weeks/[id]:', e);
    return NextResponse.json({ error: 'Failed to fetch week' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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
    const updated = await updateWeek(id, {
      title: body.title,
      description: body.description,
      unlockDate: body.unlockDate,
      liveClassDatetime: body.liveClassDatetime,
      googleMeetLink: body.googleMeetLink,
      isLocked: body.isLocked,
    });
    return NextResponse.json({ week: updated });
  } catch (e) {
    console.error('PUT /api/weeks/[id]:', e);
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 });
  }
}
