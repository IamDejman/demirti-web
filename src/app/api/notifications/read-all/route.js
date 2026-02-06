import { NextResponse } from 'next/server';
import { markAllNotificationsRead } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/notifications/read-all:', e);
    return NextResponse.json({ error: 'Failed to mark all read' }, { status: 500 });
  }
}
