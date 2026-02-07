import { NextResponse } from 'next/server';
import { setUserShadowban } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    const body = await request.json();
    const { isShadowbanned } = body || {};
    await setUserShadowban(id, isShadowbanned === true);
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: isShadowbanned ? 'user.shadowban' : 'user.unshadowban',
      targetType: 'user',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/shadowban:', e);
    return NextResponse.json({ error: 'Failed to update shadowban' }, { status: 500 });
  }
}
