import { NextResponse } from 'next/server';
import { createOfficeHourSlot, getOfficeHourSlotsForFacilitator, getOfficeHourSlotsForStudent, getCohortIdsForUser } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = user.role || '';
    if (role === 'facilitator' || role === 'admin') {
      const slots = await getOfficeHourSlotsForFacilitator(user.id);
      return NextResponse.json({ slots });
    }
    const cohortIds = await getCohortIdsForUser(user.id, role);
    const slotList = await getOfficeHourSlotsForStudent(user.id, Array.isArray(cohortIds) ? cohortIds : []);
    return NextResponse.json({ slots: slotList });
  } catch (e) {
    reportError(e, { route: 'GET /api/office-hours/slots' });
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'facilitator' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { cohortId, title, description, startTime, endTime, meetingLink, capacity } = body || {};
    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 });
    }
    const slot = await createOfficeHourSlot({
      cohortId: cohortId || null,
      facilitatorId: user.id,
      title: title || null,
      description: description || null,
      startTime,
      endTime,
      meetingLink: meetingLink || null,
      capacity: capacity || 1,
    });
    return NextResponse.json({ slot });
  } catch (e) {
    reportError(e, { route: 'POST /api/office-hours/slots' });
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}
