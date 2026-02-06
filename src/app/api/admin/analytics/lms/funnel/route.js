import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

function getRange(searchParams) {
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  if (startParam && endParam) {
    const start = new Date(startParam);
    const end = new Date(endParam);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId');
    const { start, end } = getRange(searchParams);

    const result = await sql`
      WITH enrolled AS (
        SELECT student_id, cohort_id
        FROM cohort_students
        WHERE enrolled_at BETWEEN ${start} AND ${end}
          ${cohortId ? sql`AND cohort_id = ${cohortId}` : sql``}
      ),
      submitted AS (
        SELECT DISTINCT s.student_id, a.cohort_id
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN enrolled e ON e.student_id = s.student_id AND e.cohort_id = a.cohort_id
      ),
      completed AS (
        SELECT DISTINCT cs.student_id, cs.cohort_id
        FROM cohort_students cs
        JOIN enrolled e ON e.student_id = cs.student_id AND e.cohort_id = cs.cohort_id
        WHERE cs.status = 'completed'
      ),
      certified AS (
        SELECT DISTINCT c.user_id AS student_id, c.cohort_id
        FROM certificates c
        JOIN enrolled e ON e.student_id = c.user_id AND (e.cohort_id = c.cohort_id OR c.cohort_id IS NULL)
      )
      SELECT
        (SELECT COUNT(DISTINCT student_id) FROM enrolled) AS enrolled_count,
        (SELECT COUNT(DISTINCT student_id) FROM submitted) AS submitted_count,
        (SELECT COUNT(DISTINCT student_id) FROM completed) AS completed_count,
        (SELECT COUNT(DISTINCT student_id) FROM certified) AS certified_count;
    `;

    const row = result.rows[0] || {};
    const steps = [
      { label: 'Enrolled', count: row.enrolled_count || 0 },
      { label: 'Submitted assignment', count: row.submitted_count || 0 },
      { label: 'Completed cohort', count: row.completed_count || 0 },
      { label: 'Certificate issued', count: row.certified_count || 0 },
    ];

    return NextResponse.json({ success: true, steps });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms/funnel:', e);
    return NextResponse.json({ error: 'Failed to load LMS funnel' }, { status: 500 });
  }
}
