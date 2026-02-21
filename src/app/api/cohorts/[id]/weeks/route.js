import { NextResponse } from 'next/server';
import { getCohortById, getWeeksByCohort, getCohortFacilitators, createWeek, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const isAdmin = user.role === 'admin';
    const [cohort, facilitators, isStudent] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
      !isAdmin && typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id)
        ? isStudentInCohort(id, user.id)
        : Promise.resolve(false),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    if (isAdmin) {
      const weeks = await getWeeksByCohort(id, { forStudent: false });
      return NextResponse.json({ weeks });
    }
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    if (!isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const forStudent = (user.role === 'student' || user.role === 'alumni') && isStudent;
    const weeks = await getWeeksByCohort(id, { forStudent });
    return NextResponse.json({ weeks });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts/[id]/weeks' });
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { weekNumber, title, description, unlockDate, liveClassDatetime, googleMeetLink, weekStartDate, weekEndDate, isLocked } = body;
    if (!weekNumber || !title?.trim()) {
      return NextResponse.json({ error: 'weekNumber and title are required' }, { status: 400 });
    }
    const week = await createWeek({
      cohortId: id,
      weekNumber: parseInt(weekNumber, 10),
      title: title.trim(),
      description: description?.trim() || null,
      unlockDate: unlockDate || null,
      liveClassDatetime: liveClassDatetime || null,
      googleMeetLink: googleMeetLink?.trim() || null,
      weekStartDate: weekStartDate || null,
      weekEndDate: weekEndDate || null,
      isLocked: isLocked ?? true,
    });
    return NextResponse.json({ week });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts/[id]/weeks' });
    const message = process.env.NODE_ENV === 'development' && e?.message ? e.message : 'Failed to create week';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
