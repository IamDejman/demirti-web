import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const result = await sql`
      SELECT *
      FROM ai_conversations
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    return NextResponse.json({ conversations: result.rows });
  } catch (e) {
    console.error('GET /api/ai/conversations:', e);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
