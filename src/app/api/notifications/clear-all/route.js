import { NextResponse } from 'next/server';
import { clearAllNotifications } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await clearAllNotifications(user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/notifications/clear-all' });
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}

