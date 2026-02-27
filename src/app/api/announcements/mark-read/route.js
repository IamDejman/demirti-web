import { NextResponse } from 'next/server';
import { markAnnouncementsRead } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { announcementIds } = body;
    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      return NextResponse.json({ error: 'announcementIds required' }, { status: 400 });
    }
    await markAnnouncementsRead(user.id, announcementIds);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/announcements/mark-read' });
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
