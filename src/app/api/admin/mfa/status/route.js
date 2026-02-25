import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminMfa } from '@/lib/mfa';
import { reportError } from '@/lib/logger';

export async function GET(request) {
  try {
    const [admin, authErr] = await requireAdmin(request);
    if (authErr) return authErr;

    const mfa = await getAdminMfa(admin.id);
    return NextResponse.json({
      enabled: !!(mfa && mfa.is_enabled),
    });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/mfa/status' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
