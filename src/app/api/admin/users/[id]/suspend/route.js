import { NextResponse } from 'next/server';
import { setUserSuspension } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    const body = await request.json();
    const { suspendUntil } = body || {};
    const untilDate = suspendUntil ? new Date(suspendUntil) : null;
    const safeUntil = untilDate && !Number.isNaN(untilDate.getTime()) ? untilDate : null;
    await setUserSuspension(id, safeUntil);
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: safeUntil ? 'user.suspend' : 'user.unsuspend',
      targetType: 'user',
      targetId: id,
      details: { suspendUntil: safeUntil },
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/suspend:', e);
    return NextResponse.json({ error: 'Failed to update suspension' }, { status: 500 });
  }
}
