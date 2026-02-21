import { NextResponse } from 'next/server';
import { getNotificationsForUser } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const notifications = await getNotificationsForUser(user.id, limit, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (e) {
    reportError(e, { route: 'GET /api/notifications' });
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
