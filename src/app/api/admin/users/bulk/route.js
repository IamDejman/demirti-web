import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

const ALLOWED_ROLES = ['guest', 'student', 'facilitator', 'alumni', 'admin'];
const MAX_BATCH_SIZE = 100;

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { userIds, action, role } = body || {};
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds required' }, { status: 400 });
    }
    if (userIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ error: `Maximum ${MAX_BATCH_SIZE} users per batch` }, { status: 400 });
    }
    await ensureLmsSchema();
    let updatedCount = 0;
    if (action === 'activate') {
      const res = await sql`UPDATE users SET is_active = true WHERE id = ANY(${userIds}) RETURNING id;`;
      updatedCount = res.rows.length;
    } else if (action === 'deactivate') {
      const res = await sql`UPDATE users SET is_active = false WHERE id = ANY(${userIds}) RETURNING id;`;
      updatedCount = res.rows.length;
    } else if (action === 'set_role') {
      if (!role || !ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 });
      }
      const res = await sql`UPDATE users SET role = ${role} WHERE id = ANY(${userIds}) RETURNING id;`;
      updatedCount = res.rows.length;
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: `user.${action}`,
      targetType: 'user',
      targetId: userIds.join(','),
      details: { count: updatedCount, role },
      ipAddress,
    });
    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/users/bulk' });
    return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
  }
}
