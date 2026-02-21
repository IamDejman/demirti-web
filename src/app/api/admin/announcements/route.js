import { NextResponse } from 'next/server';
import { createAnnouncement, getAnnouncementsAll, createAnnouncementNotifications, getPushSubscriptionsForUsers } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { sendAnnouncementEmails } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const announcements = await getAnnouncementsAll(200);
    return NextResponse.json({ announcements });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/announcements' });
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, body: message, scope, trackId, cohortId, isPublished, sendEmail, publishAt } = body;
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }
    if (scope === 'track' && !trackId) {
      return NextResponse.json({ error: 'trackId is required for track scope' }, { status: 400 });
    }
    if (scope === 'cohort' && !cohortId) {
      return NextResponse.json({ error: 'cohortId is required for cohort scope' }, { status: 400 });
    }
    const isUuid = typeof admin.id === 'string' && /^[0-9a-f-]{36}$/i.test(admin.id);
    const publishDate = publishAt ? new Date(publishAt) : null;
    const publishInFuture = publishDate && publishDate > new Date();
    const shouldPublishNow = !publishInFuture;
    const announcement = await createAnnouncement({
      title: title.trim(),
      body: message.trim(),
      scope: scope || 'system',
      trackId: trackId ? parseInt(trackId, 10) : null,
      cohortId: cohortId || null,
      createdBy: isUuid ? admin.id : null,
      isPublished: shouldPublishNow && (isPublished ?? true),
      publishAt: publishDate,
      sendEmail: sendEmail !== false,
    });
    let recipientsCount = 0;
    if (shouldPublishNow) {
      const recipientsResult = await createAnnouncementNotifications(announcement);
      recipientsCount = recipientsResult.recipients.length;
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
      if (sendEmail && recipientsResult.template?.emailEnabled !== false) {
        await sendAnnouncementEmails({
          recipients: recipientsResult.emailRecipients,
          announcement: { ...announcement, title: resolvedTitle, body: resolvedBody },
        });
      }
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'announcement.create',
      targetType: 'announcement',
      targetId: announcement.id,
      details: { title: announcement.title, scope: announcement.scope },
      ipAddress,
    });
    return NextResponse.json({ announcement, recipients: recipientsCount });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/announcements' });
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
