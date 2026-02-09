import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    const user = admin || (await getUserFromRequest(request));
    if (!admin && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const path = body.path || body.pathname || '';
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }
    const actor = admin || user;
    const isLegacyAdmin = admin && !user && !/^[0-9a-f-]{36}$/i.test(actor.id);
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: isLegacyAdmin ? null : actor.id,
      action: 'page.view',
      targetType: 'page',
      targetId: path,
      details: { path, role: actor.role || 'admin' },
      ipAddress,
      actorEmail: actor.email || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/audit/page-view:', e);
    return NextResponse.json({ error: 'Failed to record page view' }, { status: 500 });
  }
}
