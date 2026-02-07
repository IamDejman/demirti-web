import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: userId } = await params;
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    await ensureLmsSchema();
    const body = await request.json().catch(() => ({}));
    const provided = (body.password || '').trim();
    const tempPassword = provided || crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const hash = await bcrypt.hash(tempPassword, 10);

    await sql`
      UPDATE users
      SET password_hash = ${hash}
      WHERE id = ${userId};
    `;

    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: userId,
      details: { admin: admin.email || admin.id },
      ipAddress,
    });

    return NextResponse.json({ tempPassword });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/reset-password:', e);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
