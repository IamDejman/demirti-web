import { NextResponse } from 'next/server';
import { cancelOfficeHourBooking, cancelOfficeHourSlot } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    if (user.role === 'student' || user.role === 'alumni') {
      await cancelOfficeHourBooking(id, user.id);
      return NextResponse.json({ success: true });
    }
    if (user.role === 'facilitator' || user.role === 'admin') {
      await cancelOfficeHourSlot(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    console.error('POST /api/office-hours/slots/[id]/cancel:', e);
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }
}
