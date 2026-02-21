import { NextResponse } from 'next/server';
import { getLiveClassById, upsertAttendanceJoinClick, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Only students can record join click' }, { status: 403 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Live class ID required' }, { status: 400 });
    const liveClass = await getLiveClassById(id);
    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    const inCohort = await isStudentInCohort(liveClass.cohort_id, user.id);
    if (!inCohort) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await upsertAttendanceJoinClick(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/live-classes/[id]/join-click' });
    return NextResponse.json({ error: 'Failed to record join' }, { status: 500 });
  }
}
