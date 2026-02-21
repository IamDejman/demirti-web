import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { reportChatMessage } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function canReport(messageId, userId) {
  const res = await sql`
    SELECT m.id
    FROM chat_messages m
    JOIN chat_room_members rm ON rm.room_id = m.room_id
    WHERE m.id = ${messageId} AND rm.user_id = ${userId}
    LIMIT 1;
  `;
  return res.rows.length > 0;
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    if (!(await canReport(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const reason = body.reason?.trim() || null;
    await reportChatMessage(id, user.id, reason);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'POST /api/chat/messages/[id]/report' });
    return NextResponse.json({ error: 'Failed to report message' }, { status: 500 });
  }
}
