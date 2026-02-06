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
    const eventName = searchParams.get('event');
    const { start, end } = getRange(searchParams);
    const rows = await sql`
      SELECT name, COUNT(*)::int AS count
      FROM lms_events
      WHERE created_at BETWEEN ${start} AND ${end}
      ${eventName ? sql`AND name = ${eventName}` : sql``}
      GROUP BY name
      ORDER BY count DESC;
    `;
    return NextResponse.json({ success: true, events: rows.rows });
  } catch (e) {
    console.error('GET /api/admin/analytics/lms/events:', e);
    return NextResponse.json({ error: 'Failed to load LMS events' }, { status: 500 });
  }
}
