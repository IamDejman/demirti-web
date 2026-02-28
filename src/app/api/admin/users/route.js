import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { createUser } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import { recordAuditLog } from '@/lib/audit';

const ALLOWED_ROLES = ['guest', 'student', 'facilitator', 'alumni', 'admin'];

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const body = await request.json();
    const { email, password, firstName, lastName, role: requestedRole } = body ?? {};
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const role = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : 'student';
    const passwordValue = password?.trim() || null;
    if (passwordValue) {
      const pw = validatePassword(passwordValue);
      if (!pw.valid) {
        return NextResponse.json({ error: pw.message }, { status: 400 });
      }
    }
    const user = await createUser({
      email: email.trim(),
      password: passwordValue,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      role,
    });

    recordAuditLog({
      userId: String(admin.id),
      action: 'user.created',
      targetType: 'user',
      targetId: String(user.id),
      details: { email: user.email, role: user.role },
      actorEmail: admin.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        referralCode: user.referral_code,
        createdAt: user.created_at,
      },
    });
  } catch (e) {
    if (e.message === 'An account with this email already exists') {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    reportError(e, { route: 'POST /api/admin/users' });
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

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

    const hasFilters = q || role || status;
    let rowsRes, countRes;

    if (!hasFilters) {
      // No filters: simple query to avoid any null/cast edge cases
      [rowsRes, countRes] = await Promise.all([
        sql`
          SELECT id, email, role, first_name, last_name, is_active, created_at, last_login_at
          FROM users
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int AS total FROM users`,
      ]);
    } else {
      // Filters: single query shape with explicit casts
      const searchPattern = q ? `%${q}%` : '%';
      const roleParam = role || null;
      const statusParam = status === 'active' ? true : status === 'inactive' ? false : null;

      [rowsRes, countRes] = await Promise.all([
        sql`
          SELECT id, email, role, first_name, last_name, is_active, created_at, last_login_at
          FROM users
          WHERE (email ILIKE ${searchPattern} OR first_name ILIKE ${searchPattern} OR last_name ILIKE ${searchPattern})
            AND ((${roleParam})::user_role IS NULL OR role = (${roleParam})::user_role)
            AND ((${statusParam})::boolean IS NULL OR is_active = (${statusParam})::boolean)
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int AS total
          FROM users
          WHERE (email ILIKE ${searchPattern} OR first_name ILIKE ${searchPattern} OR last_name ILIKE ${searchPattern})
            AND ((${roleParam})::user_role IS NULL OR role = (${roleParam})::user_role)
            AND ((${statusParam})::boolean IS NULL OR is_active = (${statusParam})::boolean)
        `,
      ]);
    }

    return NextResponse.json({ users: rowsRes.rows, total: countRes.rows[0]?.total ?? 0 });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/users' });
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
