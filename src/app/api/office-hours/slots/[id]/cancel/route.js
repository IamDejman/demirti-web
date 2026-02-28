import { NextResponse } from 'next/server';
import { cancelOfficeHourBooking, cancelOfficeHourSlot } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    if (user.role === 'student' || user.role === 'alumni') {
      await cancelOfficeHourBooking(id, user.id);
      recordAuditLog({
        userId: String(user.id),
        action: 'office_hours_booking.cancelled',
        targetType: 'office_hours_slot',
        targetId: String(id),
        details: { cancelled_by: 'student' },
        actorEmail: user.email,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
      }).catch(() => {});
      return NextResponse.json({ success: true });
    }
    if (user.role === 'facilitator' || user.role === 'admin') {
      await cancelOfficeHourSlot(id);
      recordAuditLog({
        userId: String(user.id),
        action: 'office_hours_slot.cancelled',
        targetType: 'office_hours_slot',
        targetId: String(id),
        details: { cancelled_by: user.role },
        actorEmail: user.email,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
      }).catch(() => {});
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    reportError(e, { route: 'POST /api/office-hours/slots/[id]/cancel' });
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }
}
