import { NextResponse } from 'next/server';
import { getLiveClassById, updateLiveClass, getCohortFacilitators } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function POST(request, { params }) {
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
    const { recordingUrl, status } = body;
    const updated = await updateLiveClass(id, {
      recordingUrl: recordingUrl?.trim() || null,
      status: status || (recordingUrl ? 'completed' : undefined),
    });
    return NextResponse.json({ liveClass: updated });
  } catch (e) {
    console.error('POST /api/live-classes/[id]/recording:', e);
    return NextResponse.json({ error: 'Failed to set recording' }, { status: 500 });
  }
}
