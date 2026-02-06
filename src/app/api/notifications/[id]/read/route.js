import { NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    await markNotificationRead(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/notifications/[id]/read:', e);
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
