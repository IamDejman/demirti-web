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
  getLiveClassesByWeekId,
  isStudentInCohort,
} from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/validation';
import { recordAuditLog } from '@/lib/audit';

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
    const [cohort, facilitators, isStudent, liveClasses, contentItems, materials, checklistItems] = await Promise.all([
      getCohortById(week.cohort_id),
      getCohortFacilitators(week.cohort_id),
      isStudentPromise,
      getLiveClassesByWeekId(id),
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
    const firstLiveClass = liveClasses[0] || null;
    return NextResponse.json({
      week: {
        ...week,
        cohort,
        // Legacy single-class fields (kept for backward compat)
        live_class_datetime: firstLiveClass?.scheduled_at ?? week.live_class_datetime,
        google_meet_link: firstLiveClass?.google_meet_link ?? week.google_meet_link,
        live_class_id: firstLiveClass?.id,
        recording_url: firstLiveClass?.recording_url ?? null,
        // Full list of live classes for this week
        live_classes: liveClasses.map((lc) => ({
          id: lc.id,
          scheduled_at: lc.scheduled_at,
          end_time: lc.end_time,
          google_meet_link: lc.google_meet_link,
          recording_url: lc.recording_url,
          status: lc.status,
        })),
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

    recordAuditLog({
      userId: String(user.id),
      action: 'week.updated',
      targetType: 'week',
      targetId: id,
      details: { cohort_id: week.cohort_id, title: body.title ?? week.title, is_locked: body.isLocked },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ week: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/weeks/[id]' });
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 });
  }
}
