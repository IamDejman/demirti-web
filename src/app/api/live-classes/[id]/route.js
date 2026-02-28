import { NextResponse } from 'next/server';
import { getLiveClassById, deleteLiveClass, updateLiveClass, getCohortFacilitators } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(liveClass.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { weekId, scheduledAt, endTime, googleMeetLink } = body;
    if (!scheduledAt) return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
    const updated = await updateLiveClass(id, {
      weekId,
      scheduledAt,
      endTime: endTime || null,
      googleMeetLink: googleMeetLink?.trim() || null,
    });

    recordAuditLog({
      userId: String(user.id),
      action: 'live_class.updated',
      targetType: 'live_class',
      targetId: id,
      details: { cohort_id: liveClass.cohort_id, scheduled_at: scheduledAt, end_time: endTime || null },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ liveClass: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/live-classes/[id]' });
    return NextResponse.json({ error: 'Failed to update live class' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(liveClass.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await deleteLiveClass(id);

    recordAuditLog({
      userId: String(user.id),
      action: 'live_class.deleted',
      targetType: 'live_class',
      targetId: id,
      details: { cohort_id: liveClass.cohort_id, scheduled_at: liveClass.scheduled_at },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ deleted: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/live-classes/[id]' });
    return NextResponse.json({ error: 'Failed to delete live class' }, { status: 500 });
  }
}
