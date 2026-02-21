import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    await ensureLmsSchema();
    const [convRes, messagesRes] = await Promise.all([
      sql`SELECT id FROM ai_conversations WHERE id = ${id} AND user_id = ${user.id} LIMIT 1;`,
      sql`
        SELECT role, content, created_at
        FROM ai_messages
        WHERE conversation_id = ${id}
        ORDER BY created_at ASC;
      `,
    ]);
    if (convRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ messages: messagesRes.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/ai/conversations/[id]' });
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
