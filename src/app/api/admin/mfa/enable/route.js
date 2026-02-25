import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminMfa, enableAdminMfa, verifyTotp } from '@/lib/mfa';
import { rateLimit } from '@/lib/rateLimit';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_mfa_enable_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const [admin, authErr] = await requireAdmin(request);
    if (authErr) return authErr;

    const body = await request.json();
    const { code } = body || {};
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'A 6-digit code is required' }, { status: 400 });
    }

    const mfa = await getAdminMfa(admin.id);
    if (!mfa || !mfa.secret) {
      return NextResponse.json({ error: 'Run MFA setup first' }, { status: 400 });
    }
    if (mfa.is_enabled) {
      return NextResponse.json({ error: 'MFA is already enabled' }, { status: 400 });
    }

    if (!verifyTotp(mfa.secret, code)) {
      return NextResponse.json({ error: 'Invalid code. Check your authenticator app and try again.' }, { status: 400 });
    }

    await enableAdminMfa(admin.id);

    recordAuditLog({
      userId: null,
      action: 'admin.mfa_enabled',
      targetType: 'admin',
      targetId: String(admin.id),
      details: {},
      ipAddress: ip,
      actorEmail: admin.email,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/mfa/enable' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
