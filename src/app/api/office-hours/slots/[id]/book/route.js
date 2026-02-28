import { NextResponse } from 'next/server';
import { bookOfficeHourSlot, recordLmsEvent } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

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

    recordAuditLog({
      userId: String(user.id),
      action: 'office_hours_slot.booked',
      targetType: 'office_hours_slot',
      targetId: String(id),
      details: { booking_id: String(booking.id) },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ booking });
  } catch (e) {
    reportError(e, { route: 'POST /api/office-hours/slots/[id]/book' });
    return NextResponse.json({ error: e.message || 'Failed to book slot' }, { status: 500 });
  }
}
