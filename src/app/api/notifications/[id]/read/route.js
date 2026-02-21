import { NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { isValidUuid } from '@/lib/validation';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    await markNotificationRead(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/notifications/[id]/read' });
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
