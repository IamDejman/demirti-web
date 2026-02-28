import { NextResponse } from 'next/server';
import { getCohortById, getLiveClassesByCohort, getCohortFacilitators, createLiveClass } from '@/lib/db-lms';

import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators, liveClasses] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
      getLiveClassesByCohort(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ liveClasses });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts/[id]/live-classes' });
    return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { weekId, scheduledAt, endTime, googleMeetLink } = body;
    if (!weekId || !scheduledAt) {
      return NextResponse.json({ error: 'weekId and scheduledAt are required' }, { status: 400 });
    }
    const liveClass = await createLiveClass({
      weekId,
      cohortId: id,
      scheduledAt,
      endTime: endTime || null,
      googleMeetLink: googleMeetLink?.trim() || null,
    });

    recordAuditLog({
      userId: String(user.id),
      action: 'live_class.created',
      targetType: 'live_class',
      targetId: liveClass.id,
      details: { cohort_id: id, week_id: weekId, scheduled_at: scheduledAt, end_time: endTime || null },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ liveClass });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts/[id]/live-classes' });
    return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 });
  }
}
