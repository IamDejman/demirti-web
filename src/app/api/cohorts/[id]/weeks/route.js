import { NextResponse } from 'next/server';
import { getCohortById, getWeeksByCohort, getCohortFacilitators, createWeek, isStudentInCohort } from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
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

export async function POST(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
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
