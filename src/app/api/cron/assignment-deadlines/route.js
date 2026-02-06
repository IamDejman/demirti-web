import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema, createAssignmentNotifications, getPushSubscriptionsForUsers, recordLmsEvent } from '@/lib/db-lms';
import { sendAssignmentEmails } from '@/lib/notifications';
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
    const dueRes = await sql`
      SELECT a.*
      FROM assignments a
      WHERE a.deadline_at BETWEEN CURRENT_TIMESTAMP AND (CURRENT_TIMESTAMP + INTERVAL '24 hours')
        AND a.is_published = true;
    `;
    let processed = 0;
    for (const assignment of dueRes.rows) {
      const existing = await sql`
        SELECT 1
        FROM lms_events
        WHERE name = 'assignment_deadline_notified'
          AND properties->>'assignmentId' = ${assignment.id}
        LIMIT 1;
      `;
      if (existing.rows.length > 0) continue;
      const recipientsResult = await createAssignmentNotifications(assignment, 'assignment_deadline');
      if (recipientsResult.pushRecipients?.length > 0) {
        const pushSubs = await getPushSubscriptionsForUsers(recipientsResult.pushRecipients.map((r) => r.id));
        await sendPushNotifications({
          subscriptions: pushSubs,
          title: recipientsResult.title || `Assignment due: ${assignment.title}`,
          body: recipientsResult.body?.slice(0, 140) || `Deadline: ${assignment.deadline_at}`,
          url: '/dashboard/assignments',
        });
      }
      if (recipientsResult.emailRecipients.length > 0) {
        await sendAssignmentEmails({
          recipients: recipientsResult.emailRecipients,
          assignment,
          title: recipientsResult.title,
          body: recipientsResult.body,
        });
      }
      await recordLmsEvent(null, 'assignment_deadline_notified', { assignmentId: assignment.id });
      processed += 1;
    }
    return NextResponse.json({ success: true, processed });
  } catch (e) {
    console.error('GET /api/cron/assignment-deadlines:', e);
    return NextResponse.json({ error: 'Failed to process deadlines' }, { status: 500 });
  }
}
