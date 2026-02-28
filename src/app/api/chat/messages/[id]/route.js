import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function DELETE(request, { params }) {
  try {
    const user =
      (await getAdminOrUserFromRequest(request)) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });

    const msgRes = await sql`
      SELECT id, sender_id, is_deleted FROM chat_messages WHERE id = ${id} LIMIT 1;
    `;
    if (msgRes.rows.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = msgRes.rows[0];
    const isOwner = String(message.sender_id) === String(user.id);
    const isPrivileged = user.role === 'admin' || user.role === 'facilitator';

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`UPDATE chat_messages SET is_deleted = true WHERE id = ${id};`;

    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/chat/messages/[id]' });
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
