import { NextResponse } from 'next/server';
import { getLiveClassById, deleteLiveClass, getCohortFacilitators } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

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
    return NextResponse.json({ deleted: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/live-classes/[id]' });
    return NextResponse.json({ error: 'Failed to delete live class' }, { status: 500 });
  }
}
