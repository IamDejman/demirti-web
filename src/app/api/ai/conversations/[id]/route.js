import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    await ensureLmsSchema();
    const convRes = await sql`
      SELECT id FROM ai_conversations WHERE id = ${id} AND user_id = ${user.id} LIMIT 1;
    `;
    if (convRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const messagesRes = await sql`
      SELECT role, content, created_at
      FROM ai_messages
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC;
    `;
    return NextResponse.json({ messages: messagesRes.rows });
  } catch (e) {
    console.error('GET /api/ai/conversations/[id]:', e);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
