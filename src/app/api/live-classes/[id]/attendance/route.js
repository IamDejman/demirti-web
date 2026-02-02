import { NextResponse } from 'next/server';
import { getLiveClassById, getAttendanceByLiveClass, ensureAttendanceRecordsForLiveClass, bulkUpdateAttendance } from '@/lib/db-lms';
import { getCohortFacilitators } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(liveClass.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    let records = await getAttendanceByLiveClass(id);
    if (records.length === 0) {
      await ensureAttendanceRecordsForLiveClass(id, liveClass.cohort_id);
      records = await getAttendanceByLiveClass(id);
    }
    return NextResponse.json({ liveClass, attendance: records });
  } catch (e) {
    console.error('GET /api/live-classes/[id]/attendance:', e);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(liveClass.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { updates } = body;
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 });
    }
    const attendance = await bulkUpdateAttendance(id, updates, user.id);
    return NextResponse.json({ attendance });
  } catch (e) {
    console.error('POST /api/live-classes/[id]/attendance:', e);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
