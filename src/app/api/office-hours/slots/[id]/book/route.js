import { NextResponse } from 'next/server';
import { bookOfficeHourSlot, recordLmsEvent } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Only students can book' }, { status: 403 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    const booking = await bookOfficeHourSlot(id, user.id);
    await recordLmsEvent(user.id, 'office_hour_booked', { slotId: id });
    return NextResponse.json({ booking });
  } catch (e) {
    console.error('POST /api/office-hours/slots/[id]/book:', e);
    return NextResponse.json({ error: e.message || 'Failed to book slot' }, { status: 500 });
  }
}
