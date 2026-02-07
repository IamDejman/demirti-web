import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    const body = await request.json();
    const action = body.action === 'delete' ? 'delete' : body.action === 'escalate' ? 'escalate' : 'dismiss';
    await ensureLmsSchema();

    const reportRes = await sql`SELECT * FROM message_reports WHERE id = ${id} LIMIT 1;`;
    if (reportRes.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const report = reportRes.rows[0];

    if (action === 'delete') {
      await sql`UPDATE chat_messages SET is_deleted = true WHERE id = ${report.message_id};`;
    }
    if (action === 'escalate') {
      await sql`
        UPDATE message_reports
        SET is_escalated = true,
            action = ${action}
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE message_reports
        SET resolved_at = CURRENT_TIMESTAMP,
            resolved_by = ${admin.id},
            action = ${action}
        WHERE id = ${id};
      `;
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/admin/chat/reports/[id]/resolve:', e);
    return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 });
  }
}
