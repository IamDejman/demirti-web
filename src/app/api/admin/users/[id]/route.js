import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: userId } = await params;
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    await ensureLmsSchema();

    const userRes = await sql`
      SELECT id, email, role, first_name, last_name, is_active, created_at, last_login_at,
             phone, timezone, language_preference, suspended_until, is_shadowbanned
      FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `;
    const user = userRes.rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const run = async (fn, fallback) => {
      try {
        return await fn();
      } catch (err) {
        console.warn('GET /api/admin/users/[id] subquery failed:', err?.message);
        return fallback;
      }
    };

    const [enrollRes, subRes, certRes, impRes, modRes] = await Promise.all([
      run(
        () => sql`
          SELECT cs.*, c.name AS cohort_name, c.status AS cohort_status, t.track_name
          FROM cohort_students cs
          JOIN cohorts c ON c.id = cs.cohort_id
          LEFT JOIN tracks t ON t.id = c.track_id
          WHERE cs.student_id = ${userId}
          ORDER BY cs.enrolled_at DESC;
        `,
        { rows: [] }
      ),
      run(
        () => sql`
          SELECT COUNT(*)::int AS total
          FROM assignment_submissions
          WHERE student_id = ${userId};
        `,
        { rows: [{ total: 0 }] }
      ),
      run(
        () => sql`
          SELECT id, certificate_number, issued_at, pdf_url, cohort_id
          FROM certificates
          WHERE user_id = ${userId}
          ORDER BY issued_at DESC;
        `,
        { rows: [] }
      ),
      run(
        () => sql`
          SELECT * FROM admin_impersonations
          WHERE user_id = ${userId}
          ORDER BY started_at DESC
          LIMIT 20;
        `,
        { rows: [] }
      ),
      run(
        () => sql`
          SELECT ma.*, u.email AS actor_email
          FROM moderation_actions ma
          LEFT JOIN users u ON u.id = ma.created_by
          WHERE ma.user_id = ${userId}
          ORDER BY ma.created_at DESC
          LIMIT 20;
        `,
        { rows: [] }
      ),
    ]);

    return NextResponse.json({
      user,
      enrollments: enrollRes.rows || [],
      submissions: subRes.rows?.[0]?.total ?? 0,
      certificates: certRes.rows || [],
      impersonations: impRes.rows || [],
      moderationActions: modRes.rows || [],
    });
  } catch (e) {
    console.error('GET /api/admin/users/[id]:', e?.message || e);
    return NextResponse.json(
      { error: 'Failed to load user', detail: process.env.NODE_ENV === 'development' ? e?.message : undefined },
      { status: 500 }
    );
  }
}
