import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { setChatRoomMuted } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function isMember(roomId, userId) {
  const res = await sql`
    SELECT 1 FROM chat_room_members WHERE room_id = ${roomId} AND user_id = ${userId} LIMIT 1;
  `;
  return res.rows.length > 0;
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    if (!(await isMember(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const isMuted = body.isMuted === true;
    const hasEmailMuted = typeof body.emailMuted === 'boolean';
    const emailMuted = body.emailMuted === true;
    await setChatRoomMuted(id, user.id, isMuted);
    if (hasEmailMuted) {
      await sql`
        UPDATE chat_room_members
        SET email_muted = ${emailMuted}
        WHERE room_id = ${id} AND user_id = ${user.id};
      `;
    }
    return NextResponse.json({ success: true, isMuted, emailMuted: hasEmailMuted ? emailMuted : undefined });
  } catch (e) {
    console.error('POST /api/chat/rooms/[id]/mute:', e);
    return NextResponse.json({ error: 'Failed to update mute' }, { status: 500 });
  }
}
