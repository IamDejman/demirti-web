import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();

    const [rolesRes, cohortsRes, enrollRes, completionRes, gradeRes, submissionsRes, attendanceRes] = await Promise.all([
      sql`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role;`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM cohorts;`,
      sql`SELECT COUNT(DISTINCT student_id)::int AS total FROM cohort_students;`,
      sql`SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS completed, COUNT(*)::int AS total FROM cohort_students;`,
      sql`SELECT AVG(score)::float AS avg_score FROM assignment_submissions WHERE score IS NOT NULL;`,
      sql`SELECT COUNT(*)::int AS total FROM assignment_submissions;`,
      sql`SELECT COUNT(*) FILTER (WHERE status = 'present')::int AS present, COUNT(*)::int AS total FROM attendance_records;`,
    ]);

    const completion = completionRes.rows[0] || { completed: 0, total: 0 };
    const completionRate = completion.total > 0 ? Math.round((completion.completed / completion.total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesRes.rows,
        cohorts: cohortsRes.rows[0] || { total: 0, active: 0 },
        enrolledStudents: enrollRes.rows[0]?.total || 0,
        completion: { ...completion, rate: completionRate },
        avgScore: gradeRes.rows[0]?.avg_score || null,
        submissions: submissionsRes.rows[0]?.total || 0,
        attendance: attendanceRes.rows[0] || { present: 0, total: 0 },
      },
    });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms:', e);
    return NextResponse.json({ error: 'Failed to load LMS analytics' }, { status: 500 });
  }
}
