import { NextResponse } from 'next/server';
import { getOfficeHourBookingsForSlot } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'facilitator' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    const bookings = await getOfficeHourBookingsForSlot(id);
    return NextResponse.json({ bookings });
  } catch (e) {
    console.error('GET /api/office-hours/slots/[id]/bookings:', e);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
