import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const role = (searchParams.get('role') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 200);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

    const filters = sql`
      WHERE 1=1
      ${q ? sql`AND (email ILIKE ${`%${q}%`} OR first_name ILIKE ${`%${q}%`} OR last_name ILIKE ${`%${q}%`})` : sql``}
      ${role ? sql`AND role = ${role}` : sql``}
      ${status === 'active' ? sql`AND is_active = true` : sql``}
      ${status === 'inactive' ? sql`AND is_active = false` : sql``}
    `;

    const [rowsRes, countRes] = await Promise.all([
      sql`
        SELECT id, email, role, first_name, last_name, is_active, created_at, last_login_at
        FROM users
        ${filters}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM users
        ${filters};
      `,
    ]);

    return NextResponse.json({ users: rowsRes.rows, total: countRes.rows[0]?.total || 0 });
  } catch (e) {
    console.error('GET /api/admin/users:', e);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
