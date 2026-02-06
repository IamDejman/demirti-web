import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema, createAnnouncementNotifications, getPushSubscriptionsForUsers } from '@/lib/db-lms';
import { sendAnnouncementEmails } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureLmsSchema();
    const due = await sql`
      UPDATE announcements
      SET is_published = true
      WHERE is_published = false
        AND publish_at IS NOT NULL
        AND publish_at <= CURRENT_TIMESTAMP
      RETURNING *;
    `;

    let processed = 0;
    for (const announcement of due.rows) {
      const recipientsResult = await createAnnouncementNotifications(announcement);
      const resolvedTitle = recipientsResult.title || announcement.title;
      const resolvedBody = recipientsResult.body || announcement.body;
      if (recipientsResult.pushRecipients?.length > 0) {
        const pushSubs = await getPushSubscriptionsForUsers(recipientsResult.pushRecipients.map((r) => r.id));
        await sendPushNotifications({
          subscriptions: pushSubs,
          title: resolvedTitle,
          body: resolvedBody?.slice(0, 140) || 'New announcement',
          url: '/dashboard',
        });
      }
      if (announcement.send_email && recipientsResult.template?.emailEnabled !== false) {
        await sendAnnouncementEmails({
          recipients: recipientsResult.emailRecipients,
          announcement: { ...announcement, title: resolvedTitle, body: resolvedBody },
        });
      }
      processed += 1;
    }

    return NextResponse.json({ success: true, processed });
  } catch (e) {
    console.error('GET /api/cron/announcements:', e);
    return NextResponse.json({ error: 'Failed to process announcements' }, { status: 500 });
  }
}
