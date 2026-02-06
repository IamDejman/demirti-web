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
      return { start, end, days: Math.ceil((end - start) / (24 * 60 * 60 * 1000)) };
    }
  }
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, days };
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId');
    const { start, end } = getRange(searchParams);

    const enrollments = await sql`
      SELECT DATE_TRUNC('day', enrolled_at)::DATE AS day, COUNT(*)::int AS count
      FROM cohort_students
      WHERE enrolled_at BETWEEN ${start} AND ${end}
      ${cohortId ? sql`AND cohort_id = ${cohortId}` : sql``}
      GROUP BY day
      ORDER BY day ASC;
    `;
    const completions = await sql`
      SELECT DATE_TRUNC('day', completed_at)::DATE AS day, COUNT(*)::int AS count
      FROM cohort_students
      WHERE completed_at IS NOT NULL
        AND completed_at BETWEEN ${start} AND ${end}
        ${cohortId ? sql`AND cohort_id = ${cohortId}` : sql``}
      GROUP BY day
      ORDER BY day ASC;
    `;
    const submissions = await sql`
      SELECT DATE_TRUNC('day', s.submitted_at)::DATE AS day, COUNT(*)::int AS count
      FROM assignment_submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE s.submitted_at BETWEEN ${start} AND ${end}
        ${cohortId ? sql`AND a.cohort_id = ${cohortId}` : sql``}
      GROUP BY day
      ORDER BY day ASC;
    `;
    const certificates = await sql`
      SELECT DATE_TRUNC('day', issued_at)::DATE AS day, COUNT(*)::int AS count
      FROM certificates
      WHERE issued_at BETWEEN ${start} AND ${end}
        ${cohortId ? sql`AND cohort_id = ${cohortId}` : sql``}
      GROUP BY day
      ORDER BY day ASC;
    `;

    return NextResponse.json({
      success: true,
      data: {
        start,
        end,
        enrollments: enrollments.rows,
        submissions: submissions.rows,
        completions: completions.rows,
        certificates: certificates.rows,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms/timeseries:', e);
    return NextResponse.json({ error: 'Failed to load LMS timeseries' }, { status: 500 });
  }
}
