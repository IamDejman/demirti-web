import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { createChatMessage, getChatMessages, markChatRoomRead, getChatRoomNotificationRecipients, createChatNotifications, getPushSubscriptionsForUsers, recordLmsEvent, applyNotificationTemplate } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { sendChatMessageEmails } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';
import { rateLimit } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';
import { validateBody, chatMessageSchema } from '@/lib/schemas';

async function isMember(roomId, userId) {
  const res = await sql`
    SELECT 1 FROM chat_room_members WHERE room_id = ${roomId} AND user_id = ${userId} LIMIT 1;
  `;
  return res.rows.length > 0;
}

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    if (!(await isMember(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const before = searchParams.get('before');
    const messages = await getChatMessages(id, limit, before || null, user.id);
    await markChatRoomRead(id, user.id);
    return NextResponse.json({ messages: messages.reverse() });
  } catch (e) {
    reportError(e, { route: 'GET /api/chat/rooms/[id]/messages' });
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    if (!(await isMember(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const [data, validationErr] = await validateBody(request, chatMessageSchema);
    if (validationErr) return validationErr;
    const { message } = data;
    const limiter = await rateLimit(`chat_message_${user.id}`, { windowMs: 60_000, limit: 40 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many messages. Slow down.' }, { status: 429 });
    }
    const created = await createChatMessage(id, user.id, message);

    // Fire-and-forget: notifications should never break message sending
    try {
      const roomRes = await sql`
        SELECT id, type, title, cohort_id
        FROM chat_rooms
        WHERE id = ${id}
        LIMIT 1;
      `;
      const room = roomRes.rows[0];
      const roomTitle = room?.title || (room?.type === 'cohort' ? 'Cohort chat' : room?.type === 'dm' ? 'Direct message' : 'Chat');
      const template = await applyNotificationTemplate(
        'chat_message',
        `New message in ${roomTitle}`,
        `${user.first_name || user.email}: ${message.slice(0, 140)}`,
        {
          sender: user.first_name || user.email,
          room: roomTitle,
          message: message.slice(0, 140),
        }
      );
      if (created.is_shadowbanned) {
        await recordLmsEvent(user.id, 'chat_message_shadowbanned', { roomId: id });
        return NextResponse.json({ message: created });
      }
      const recipients = await getChatRoomNotificationRecipients(id, user.id);
      const now = Date.now();
      const inAppRecipients = recipients.filter((r) => template.inAppEnabled !== false
        && (r.in_app_enabled !== false)
        && (r.in_app_chat !== false)
        && !r.is_muted);
      const emailRecipients = recipients.filter((r) => {
        if (template.emailEnabled === false || r.email_enabled === false || r.email_chat === false || r.email_muted) return false;
        if (!r.last_read_at) return true;
        const lastReadMs = new Date(r.last_read_at).getTime();
        return Number.isNaN(lastReadMs) || now - lastReadMs > 2 * 60 * 1000;
      });
      const pushRecipients = recipients.filter((r) => template.inAppEnabled !== false
        && r.push_chat !== false
        && !r.is_muted);
      if (inAppRecipients.length > 0) {
        await createChatNotifications({
          title: template.title,
          body: template.body,
          roomId: id,
          recipientIds: inAppRecipients.map((r) => r.id),
        });
      }
      if (pushRecipients.length > 0) {
        const pushSubs = await getPushSubscriptionsForUsers(pushRecipients.map((r) => r.id));
        await sendPushNotifications({
          subscriptions: pushSubs,
          title: template.title,
          body: template.body,
          url: '/dashboard/chat',
        });
      }
      if (emailRecipients.length > 0) {
        await sendChatMessageEmails({
          recipients: emailRecipients,
          message: created,
          sender: user,
          roomTitle,
          title: template.title,
          body: template.body,
        });
      }
      await recordLmsEvent(user.id, 'chat_message_sent', { roomId: id });
    } catch (notifErr) {
      // Log but don't fail the message send
      reportError(notifErr, { route: 'POST /api/chat/rooms/[id]/messages (notifications)' });
    }

    return NextResponse.json({ message: created });
  } catch (e) {
    console.error('[POST /api/chat/rooms/[id]/messages] Error:', e.message, e.stack?.slice(0, 500));
    reportError(e, { route: 'POST /api/chat/rooms/[id]/messages' });
    return NextResponse.json({ error: 'Failed to send message', debug: e.message }, { status: 500 });
  }
}
