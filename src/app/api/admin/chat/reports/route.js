import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const roomQuery = (searchParams.get('room') || '').trim();
    const senderQuery = (searchParams.get('sender') || '').trim();
    const fromParam = (searchParams.get('from') || '').trim();
    const toParam = (searchParams.get('to') || '').trim();
    const fromDate = fromParam ? new Date(fromParam) : null;
    const toDate = toParam ? new Date(toParam) : null;
    const safeFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null;
    const safeTo = toDate && !Number.isNaN(toDate.getTime()) ? toDate : null;
    const result = await sql`
      SELECT r.id AS report_id, r.reason, r.created_at, r.resolved_at, r.is_escalated,
             m.id AS message_id, m.body AS message_body, m.created_at AS message_created_at,
             sender.id AS sender_id, sender.email AS sender_email, sender.first_name AS sender_first_name, sender.last_name AS sender_last_name,
             reporter.id AS reporter_id, reporter.email AS reporter_email, reporter.first_name AS reporter_first_name, reporter.last_name AS reporter_last_name,
             room.id AS room_id, room.title AS room_title, room.type AS room_type
      FROM message_reports r
      JOIN chat_messages m ON m.id = r.message_id
      JOIN users sender ON sender.id = m.sender_id
      JOIN users reporter ON reporter.id = r.reported_by
      JOIN chat_rooms room ON room.id = m.room_id
      WHERE r.resolved_at IS NULL
        ${roomQuery ? sql`AND (room.title ILIKE ${`%${roomQuery}%`} OR room.id::text ILIKE ${`%${roomQuery}%`})` : sql``}
        ${senderQuery ? sql`AND (
          sender.email ILIKE ${`%${senderQuery}%`} OR
          sender.first_name ILIKE ${`%${senderQuery}%`} OR
          sender.last_name ILIKE ${`%${senderQuery}%`}
        )` : sql``}
        ${safeFrom ? sql`AND r.created_at >= ${safeFrom}` : sql``}
        ${safeTo ? sql`AND r.created_at <= ${safeTo}` : sql``}
      ORDER BY r.created_at DESC;
    `;
    return NextResponse.json({ reports: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/chat/reports' });
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
