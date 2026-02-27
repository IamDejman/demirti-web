import { NextResponse } from 'next/server';
import { getUnreadAnnouncementCount } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const count = await getUnreadAnnouncementCount(user.id, user.role);
    return NextResponse.json({ count });
  } catch (e) {
    reportError(e, { route: 'GET /api/announcements/unread-count' });
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
