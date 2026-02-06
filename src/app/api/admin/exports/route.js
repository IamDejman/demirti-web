import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h] ?? '';
      const safe = String(val).replace(/\"/g, '\"\"');
      return `"${safe}"`;
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    let rows = [];
    if (type === 'users') {
      const res = await sql`SELECT id, email, role, first_name, last_name, created_at, is_active FROM users ORDER BY created_at DESC;`;
      rows = res.rows;
    } else if (type === 'cohort_students') {
      const res = await sql`
        SELECT cs.id, cs.cohort_id, c.name AS cohort_name, cs.student_id, u.email, cs.status, cs.enrolled_at, cs.completed_at
        FROM cohort_students cs
        JOIN users u ON u.id = cs.student_id
        JOIN cohorts c ON c.id = cs.cohort_id
        ORDER BY cs.enrolled_at DESC;
      `;
      rows = res.rows;
    } else if (type === 'submissions') {
      const res = await sql`
        SELECT s.id, s.assignment_id, a.title AS assignment_title, s.student_id, u.email, s.status, s.score, s.submitted_at, s.graded_at
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN users u ON u.id = s.student_id
        ORDER BY s.submitted_at DESC;
      `;
      rows = res.rows;
    } else if (type === 'attendance') {
      const res = await sql`
        SELECT ar.id, ar.live_class_id, lc.scheduled_at, ar.student_id, u.email, ar.status, ar.join_clicked_at, ar.marked_at
        FROM attendance_records ar
        JOIN live_classes lc ON lc.id = ar.live_class_id
        JOIN users u ON u.id = ar.student_id
        ORDER BY ar.marked_at DESC NULLS LAST;
      `;
      rows = res.rows;
    } else {
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${type}.csv"`,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/exports:', e);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
