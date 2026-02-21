import { NextResponse } from 'next/server';
import { reportError } from '@/lib/logger';
import {
  getWeekById,
  getContentItemsByWeek,
  getMaterialsByWeek,
  getChecklistItemsByWeek,
  getStudentChecklistProgress,
  updateWeek,
  getCohortById,
  getCohortFacilitators,
  getLiveClassByWeekId,
  isStudentInCohort,
} from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    // cohort_students.student_id is UUID; legacy admins have integer id
    const userIdIsUuid = user.id != null && /^[0-9a-f-]{36}$/i.test(String(user.id));
    const isStudentPromise = userIdIsUuid ? isStudentInCohort(week.cohort_id, user.id) : Promise.resolve(false);
    const checklistPromise = (user.role === 'student' || user.role === 'alumni') && userIdIsUuid
      ? getStudentChecklistProgress(user.id, id)
      : getChecklistItemsByWeek(id);
    const [cohort, facilitators, isStudent, liveClass, contentItems, materials, checklistItems] = await Promise.all([
      getCohortById(week.cohort_id),
      getCohortFacilitators(week.cohort_id),
      isStudentPromise,
      getLiveClassByWeekId(id),
      getContentItemsByWeek(id),
      getMaterialsByWeek(id),
      checklistPromise,
    ]);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((user.role === 'student' || user.role === 'alumni') && week.is_locked && week.unlock_date && new Date(week.unlock_date) > new Date()) {
      return NextResponse.json({ error: 'Week is locked' }, { status: 403 });
    }
    return NextResponse.json({
      week: {
        ...week,
        cohort,
        live_class_datetime: liveClass?.scheduled_at ?? week.live_class_datetime,
        google_meet_link: liveClass?.google_meet_link ?? week.google_meet_link,
        live_class_id: liveClass?.id,
        recording_url: liveClass?.recording_url ?? null,
      },
      contentItems,
      materials,
      checklistItems,
    });
  } catch (e) {
    reportError(e, { route: 'GET /api/weeks/[id]' });
    return NextResponse.json({ error: 'Failed to fetch week' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
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
      weekStartDate: body.weekStartDate,
      weekEndDate: body.weekEndDate,
      isLocked: body.isLocked,
    });
    return NextResponse.json({ week: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/weeks/[id]' });
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 });
  }
}
