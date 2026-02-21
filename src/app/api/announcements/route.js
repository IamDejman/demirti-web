import { NextResponse } from 'next/server';
import { getAnnouncementsForUser } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const announcements = await getAnnouncementsForUser(user.id, user.role, limit);
    return NextResponse.json({ announcements });
  } catch (e) {
    reportError(e, { route: 'GET /api/announcements' });
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
