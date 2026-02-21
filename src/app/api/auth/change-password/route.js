import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { getUserFromRequest, updateUserPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import { rateLimit } from '@/lib/rateLimit';
import { validateBody, forcedChangePasswordSchema } from '@/lib/schemas';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = await rateLimit(`auth_change_pw_${ip}`, { windowMs: 60_000, limit: 5 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!user.must_change_password) {
      return NextResponse.json(
        { error: 'Password change is not required for your account' },
        { status: 403 }
      );
    }

    const [data, validationErr] = await validateBody(request, forcedChangePasswordSchema);
    if (validationErr) return validationErr;
    const { newPassword } = data;

    const pw = validatePassword(newPassword);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.message }, { status: 400 });
    }

    await updateUserPassword(user.id, newPassword);
    recordAuditLog({
      userId: user.id,
      action: 'user.password_changed',
      targetType: 'user',
      targetId: user.id,
      details: { type: 'forced_change' },
      ipAddress: ip,
      actorEmail: user.email,
    }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/auth/change-password' });
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
