import { NextResponse } from 'next/server';
import { deleteNotification } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { isValidUuid } from '@/lib/validation';

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params || {};
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    await deleteNotification(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/notifications/[id]' });
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

