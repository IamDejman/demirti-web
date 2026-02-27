import { NextResponse } from 'next/server';
import { dismissAnnouncementForUser } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { isValidUuid } from '@/lib/validation';

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    await dismissAnnouncementForUser(user.id, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/announcements/[id]' });
    return NextResponse.json({ error: 'Failed to dismiss announcement' }, { status: 500 });
  }
}
