import { NextResponse } from 'next/server';
import { setUserSuspension, setUserShadowban, setUserActiveStatus, recordModerationAction } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: userId } = await params;
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    const body = await request.json();
    const action = body.action;
    const reason = body.reason || null;

    switch (action) {
      case 'warn':
        await recordModerationAction({ userId, action: 'warn', reason, createdBy: admin.id });
        break;
      case 'deactivate':
        await setUserActiveStatus(userId, false);
        await recordModerationAction({ userId, action: 'deactivate', reason, createdBy: admin.id });
        break;
      case 'reactivate':
        await setUserActiveStatus(userId, true);
        await recordModerationAction({ userId, action: 'reactivate', reason, createdBy: admin.id });
        break;
      case 'suspend': {
        const suspendUntil = body.suspendUntil ? new Date(body.suspendUntil) : null;
        await setUserSuspension(userId, suspendUntil);
        await recordModerationAction({ userId, action: 'suspend', reason, createdBy: admin.id });
        break;
      }
      case 'shadowban':
        await setUserShadowban(userId, true);
        await recordModerationAction({ userId, action: 'shadowban', reason, createdBy: admin.id });
        break;
      case 'unshadowban':
        await setUserShadowban(userId, false);
        await recordModerationAction({ userId, action: 'unshadowban', reason, createdBy: admin.id });
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/moderation:', e);
    return NextResponse.json({ error: 'Failed to apply moderation action' }, { status: 500 });
  }
}
