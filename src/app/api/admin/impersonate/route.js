import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail, createUserSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { email, userId } = body || {};
    await ensureLmsSchema();
    let user = null;
    if (userId) {
      const res = await sql`SELECT id, email, role FROM users WHERE id = ${userId} LIMIT 1;`;
      user = res.rows[0];
    } else if (email) {
      user = await getUserByEmail(email);
    }
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const token = crypto.randomBytes(32).toString('hex');
    await createUserSession(user.id, token);
    const isUuid = typeof admin.id === 'string' && /^[0-9a-f-]{36}$/i.test(admin.id);
    if (isUuid) {
      await sql`
        INSERT INTO admin_impersonations (admin_id, user_id)
        VALUES (${admin.id}, ${user.id});
      `;
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'admin.impersonate',
      targetType: 'user',
      targetId: user.id,
      details: { email: user.email },
      ipAddress,
    });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    console.error('POST /api/admin/impersonate:', e);
    return NextResponse.json({ error: 'Failed to impersonate' }, { status: 500 });
  }
}
