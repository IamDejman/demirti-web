import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import {
  addChatRoomMember,
  createDmRoom,
  ensureCohortChatRoom,
  getCohortIdsForUser,
} from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getUserByEmail } from '@/lib/auth';
import { validateBody, chatRoomSchema } from '@/lib/schemas';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cohortIds = await getCohortIdsForUser(user.id, user.role);
    let cohortMap = {};
    if (cohortIds.length > 0) {
      const cohortResult = await sql`
        SELECT id, name FROM cohorts WHERE id = ANY(${cohortIds});
      `;
      cohortMap = cohortResult.rows.reduce((acc, row) => {
        acc[row.id] = row.name;
        return acc;
      }, {});
      await Promise.all(
        cohortResult.rows.map(async (cohort) => {
          const room = await ensureCohortChatRoom(cohort.id, cohort.name, user.id);
          await addChatRoomMember(room.id, user.id);
        })
      );
    }

    const roomsRes = await sql`
      SELECT r.*, m.last_read_at, m.is_muted, m.email_muted,
        (SELECT COUNT(*)
         FROM chat_messages cm
         WHERE cm.room_id = r.id
           AND cm.created_at > COALESCE(m.last_read_at, '1970-01-01')
           AND cm.sender_id <> ${user.id}) AS unread_count
      FROM chat_rooms r
      JOIN chat_room_members m ON m.room_id = r.id AND m.user_id = ${user.id}
      ORDER BY r.last_message_at DESC NULLS LAST, r.created_at DESC;
    `;
    const rooms = roomsRes.rows;
    const roomIds = rooms.map((r) => r.id);
    let membersByRoom = {};
    if (roomIds.length > 0) {
      const members = await sql`
        SELECT m.room_id, u.id, u.first_name, u.last_name, u.email
        FROM chat_room_members m
        JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ANY(${roomIds});
      `;
      membersByRoom = members.rows.reduce((acc, row) => {
        acc[row.room_id] = acc[row.room_id] || [];
        acc[row.room_id].push(row);
        return acc;
      }, {});
    }

    const normalized = rooms.map((room) => {
      let displayTitle = room.title || 'Chat';
      if (room.type === 'cohort' && !room.title && room.cohort_id && cohortMap[room.cohort_id]) {
        displayTitle = cohortMap[room.cohort_id];
      }
      if (room.type === 'dm') {
        const members = membersByRoom[room.id] || [];
        const other = members.find((m) => m.id !== user.id);
        displayTitle = other ? `${other.first_name || ''} ${other.last_name || ''}`.trim() || other.email : 'Direct message';
      }
      return { ...room, displayTitle, members: membersByRoom[room.id] || [] };
    });

    return NextResponse.json({ rooms: normalized });
  } catch (e) {
    reportError(e, { route: 'GET /api/chat/rooms' });
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const [data, validationErr] = await validateBody(request, chatRoomSchema);
    if (validationErr) return validationErr;
    const { type, otherUserId, email } = data;
    if (type !== 'dm') {
      return NextResponse.json({ error: 'Only dm is supported' }, { status: 400 });
    }
    let targetId = otherUserId;
    if (!targetId && email) {
      const other = await getUserByEmail(email);
      if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      targetId = other.id;
    }
    if (!targetId) return NextResponse.json({ error: 'otherUserId or email required' }, { status: 400 });
    if (targetId === user.id) return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 });
    const room = await createDmRoom(user.id, targetId);
    return NextResponse.json({ room });
  } catch (e) {
    reportError(e, { route: 'POST /api/chat/rooms' });
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
