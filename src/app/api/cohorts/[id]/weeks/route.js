import { NextResponse } from 'next/server';
import { getCohortById, getWeeksByCohort, getCohortFacilitators, createWeek, isStudentInCohort } from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      const weeks = await getWeeksByCohort(id, { forStudent: false });
      return NextResponse.json({ weeks });
    }
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    const isStudent = typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id)
      ? await isStudentInCohort(id, user.id)
      : false;
    if (!isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const forStudent = (user.role === 'student' || user.role === 'alumni') && isStudent;
    const weeks = await getWeeksByCohort(id, { forStudent });
    return NextResponse.json({ weeks });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/weeks:', e);
    const msg = process.env.NODE_ENV === 'development' ? e.message : 'Failed to fetch weeks';
    return NextResponse.json({ error: 'Failed to fetch weeks', detail: msg }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { weekNumber, title, description, unlockDate, liveClassDatetime, googleMeetLink, isLocked } = body;
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
      isLocked: isLocked ?? true,
    });
    return NextResponse.json({ week });
  } catch (e) {
    console.error('POST /api/cohorts/[id]/weeks:', e);
    return NextResponse.json({ error: 'Failed to create week' }, { status: 500 });
  }
}
