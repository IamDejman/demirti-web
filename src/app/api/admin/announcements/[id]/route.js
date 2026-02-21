import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema, createAnnouncementNotifications, getPushSubscriptionsForUsers } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { sendAnnouncementEmails } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    const body = await request.json();
    await ensureLmsSchema();
    if (body?.publishNow) {
      const existingRes = await sql`SELECT * FROM announcements WHERE id = ${id} LIMIT 1;`;
      const existing = existingRes.rows[0];
      if (!existing) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }
      if (existing.is_published) {
        return NextResponse.json({ announcement: existing });
      }
      const publishAt = new Date();
      const updatedRes = await sql`
        UPDATE announcements
        SET is_published = true,
            publish_at = ${publishAt}
        WHERE id = ${id}
        RETURNING *;
      `;
      const updated = updatedRes.rows[0];
      const recipientsResult = await createAnnouncementNotifications(updated);
      const resolvedTitle = recipientsResult.title || updated.title;
      const resolvedBody = recipientsResult.body || updated.body;
      if (recipientsResult.pushRecipients?.length > 0) {
        const pushSubs = await getPushSubscriptionsForUsers(recipientsResult.pushRecipients.map((r) => r.id));
        await sendPushNotifications({
          subscriptions: pushSubs,
          title: resolvedTitle,
          body: resolvedBody?.slice(0, 140) || 'New announcement',
          url: '/dashboard',
        });
      }
      if (updated.send_email && recipientsResult.template?.emailEnabled !== false) {
        await sendAnnouncementEmails({
          recipients: recipientsResult.emailRecipients,
          announcement: { ...updated, title: resolvedTitle, body: resolvedBody },
        });
      }
      const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
      await recordAuditLog({
        userId: admin.id,
        action: 'announcement.publish_now',
        targetType: 'announcement',
        targetId: id,
        details: { title: updated.title },
        ipAddress,
      });
      return NextResponse.json({ announcement: updated, recipients: recipientsResult.recipients.length });
    }

    const { title, body: message, scope, trackId, cohortId, publishAt, sendEmail } = body;
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }
    const publishDate = publishAt ? new Date(publishAt) : null;
    const publishInFuture = publishDate && publishDate > new Date();
    const isPublished = publishInFuture ? false : true;
    const parsedTrackId = trackId ? parseInt(trackId, 10) : null;
    const parsedCohortId = cohortId || null;
    const result = await sql`
      UPDATE announcements
      SET title = ${title.trim()},
          body = ${message.trim()},
          scope = ${scope || 'system'},
          track_id = ${parsedTrackId},
          cohort_id = ${parsedCohortId},
          publish_at = ${publishDate},
          is_published = ${isPublished},
          send_email = ${sendEmail !== false}
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'announcement.update',
      targetType: 'announcement',
      targetId: id,
      details: { title: result.rows[0].title, scope: result.rows[0].scope },
      ipAddress,
    });
    return NextResponse.json({ announcement: result.rows[0] });
  } catch (e) {
    reportError(e, { route: 'PUT /api/admin/announcements/[id]' });
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM announcements WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'announcement.delete',
      targetType: 'announcement',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/admin/announcements/[id]' });
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
