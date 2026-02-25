import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { generateTotpSecret, generateTotpUri, saveAdminMfaSecret, getAdminMfa } from '@/lib/mfa';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/api-helpers';
import { recordAuditLog } from '@/lib/audit';
import { reportError } from '@/lib/logger';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`admin_mfa_setup_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const [admin, authErr] = await requireAdmin(request);
    if (authErr) return authErr;

    const existing = await getAdminMfa(admin.id);
    if (existing && existing.is_enabled) {
      return NextResponse.json({ error: 'MFA is already enabled. Disable it first to reconfigure.' }, { status: 400 });
    }

    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, admin.email);

    await saveAdminMfaSecret(admin.id, secret);

    recordAuditLog({
      userId: null,
      action: 'admin.mfa_setup',
      targetType: 'admin',
      targetId: String(admin.id),
      details: {},
      ipAddress: ip,
      actorEmail: admin.email,
    }).catch(() => {});

    return NextResponse.json({ secret, uri });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/mfa/setup' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
