import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();

    const result = await sql`
      SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.current_week,
             t.track_name,
             (SELECT COUNT(*) FROM cohort_students cs WHERE cs.cohort_id = c.id) AS enrolled,
             (SELECT COUNT(*) FROM cohort_students cs WHERE cs.cohort_id = c.id AND cs.status = 'completed') AS completed,
             (SELECT COUNT(DISTINCT s.student_id)
              FROM assignment_submissions s
              JOIN assignments a ON a.id = s.assignment_id
              WHERE a.cohort_id = c.id) AS students_submitted,
             (SELECT AVG(s.score)::float
              FROM assignment_submissions s
              JOIN assignments a ON a.id = s.assignment_id
              WHERE a.cohort_id = c.id AND s.score IS NOT NULL) AS avg_score,
             (SELECT COUNT(*)
              FROM attendance_records ar
              JOIN live_classes lc ON lc.id = ar.live_class_id
              WHERE lc.cohort_id = c.id) AS attendance_total,
             (SELECT COUNT(*)
              FROM attendance_records ar
              JOIN live_classes lc ON lc.id = ar.live_class_id
              WHERE lc.cohort_id = c.id AND ar.status = 'present') AS attendance_present
      FROM cohorts c
      LEFT JOIN tracks t ON t.id = c.track_id
      ORDER BY c.start_date DESC;
    `;

    return NextResponse.json({ success: true, cohorts: result.rows });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms/cohorts:', e);
    return NextResponse.json({ error: 'Failed to load cohort comparisons' }, { status: 500 });
  }
}
