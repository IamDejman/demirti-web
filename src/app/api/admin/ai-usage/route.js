import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const [byDayRes, topUsersRes, blockedRes] = await Promise.all([
      sql`
        SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*)::int AS count
        FROM ai_messages
        WHERE role = 'assistant' AND created_at BETWEEN ${start} AND ${end}
        GROUP BY day
        ORDER BY day ASC;
      `,
      sql`
        SELECT u.id, u.email, u.first_name, u.last_name, COUNT(*)::int AS count
        FROM ai_messages m
        JOIN ai_conversations c ON c.id = m.conversation_id
        JOIN users u ON u.id = c.user_id
        WHERE m.role = 'assistant' AND m.created_at BETWEEN ${start} AND ${end}
        GROUP BY u.id, u.email, u.first_name, u.last_name
        ORDER BY count DESC
        LIMIT 20;
      `,
      sql`
        SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*)::int AS count
        FROM lms_events
        WHERE name = 'ai_message_blocked' AND created_at BETWEEN ${start} AND ${end}
        GROUP BY day
        ORDER BY day ASC;
      `,
    ]);

    const totalsRes = await sql`
      SELECT COUNT(*)::int AS total_messages, COUNT(DISTINCT c.user_id)::int AS total_users
      FROM ai_messages m
      JOIN ai_conversations c ON c.id = m.conversation_id
      WHERE m.role = 'assistant' AND m.created_at BETWEEN ${start} AND ${end};
    `;

    return NextResponse.json({
      success: true,
      data: {
        byDay: byDayRes.rows,
        topUsers: topUsersRes.rows,
        blockedByDay: blockedRes.rows,
        totals: totalsRes.rows[0] || { total_messages: 0, total_users: 0 },
      },
    });
  } catch (e) {
    console.error('GET /api/admin/ai-usage:', e);
    return NextResponse.json({ error: 'Failed to load AI usage' }, { status: 500 });
  }
}
