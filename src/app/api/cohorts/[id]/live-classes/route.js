import { NextResponse } from 'next/server';
import { getCohortById, getLiveClassesByCohort, getCohortFacilitators, createLiveClass } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const liveClasses = await getLiveClassesByCohort(id);
    return NextResponse.json({ liveClasses });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/live-classes:', e);
    return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { weekId, scheduledAt, googleMeetLink } = body;
    if (!weekId || !scheduledAt) {
      return NextResponse.json({ error: 'weekId and scheduledAt are required' }, { status: 400 });
    }
    const liveClass = await createLiveClass({
      weekId,
      cohortId: id,
      scheduledAt,
      googleMeetLink: googleMeetLink?.trim() || null,
    });
    return NextResponse.json({ liveClass });
  } catch (e) {
    console.error('POST /api/cohorts/[id]/live-classes:', e);
    return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 });
  }
}
