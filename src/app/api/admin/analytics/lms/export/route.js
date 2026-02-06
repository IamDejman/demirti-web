import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

function escapeCsvCell(val) {
  if (val == null) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => escapeCsvCell(row[col])).join(','));
  return [header, ...lines].join('\n');
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const eventName = searchParams.get('event');
    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'start and end are required' }, { status: 400 });
    }
    const start = new Date(startParam);
    const end = new Date(endParam);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end date' }, { status: 400 });
    }
    const rows = await sql`
      SELECT id, user_id, name, properties, created_at
      FROM lms_events
      WHERE created_at BETWEEN ${start} AND ${end}
      ${eventName ? sql`AND name = ${eventName}` : sql``}
      ORDER BY created_at DESC
      LIMIT 20000;
    `;
    const columns = ['id', 'user_id', 'name', 'properties', 'created_at'];
    const csv = rowsToCsv(rows.rows, columns);
    const filename = `lms-events-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms/export:', e);
    return NextResponse.json({ error: 'Failed to export LMS events' }, { status: 500 });
  }
}
