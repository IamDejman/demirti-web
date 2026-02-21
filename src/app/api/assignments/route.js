import { NextResponse } from 'next/server';
import { createAssignment, getWeekById, getCohortFacilitators, createAssignmentNotifications, getPushSubscriptionsForUsers, recordLmsEvent } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { sendAssignmentEmails } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';

export async function POST(request) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const weekId = body?.weekId;
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 });
    const week = await getWeekById(weekId);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const {
      weekId: wId,
      cohortId,
      title,
      description,
      submissionType,
      allowedFileTypes,
      maxFileSizeMb,
      deadlineAt,
      maxScore,
      isPublished,
      publishAt,
    } = body;
    if (!title?.trim() || !deadlineAt) {
      return NextResponse.json({ error: 'title and deadlineAt are required' }, { status: 400 });
    }
    // created_by references users(id) UUID; legacy admins have integer id, so pass null for them
    const createdBy = user.id != null && /^[0-9a-f-]{36}$/i.test(String(user.id)) ? user.id : null;
    const assignment = await createAssignment({
      weekId: wId || weekId,
      cohortId: cohortId || week.cohort_id,
      title: title.trim(),
      description: description?.trim() || null,
      submissionType: submissionType || 'text',
      allowedFileTypes: Array.isArray(allowedFileTypes) ? allowedFileTypes : null,
      maxFileSizeMb: maxFileSizeMb ?? null,
      deadlineAt,
      maxScore: maxScore ?? 100,
      isPublished: isPublished ?? false,
      publishAt: publishAt || null,
      createdBy,
    });
    await recordLmsEvent(createdBy ?? null, 'assignment_created', { assignmentId: assignment.id, cohortId: assignment.cohort_id });
    const publishNow = assignment.is_published && (!assignment.publish_at || new Date(assignment.publish_at) <= new Date());
    if (publishNow) {
      const recipientsResult = await createAssignmentNotifications(assignment, 'assignment_posted');
      if (recipientsResult.pushRecipients?.length > 0) {
        const pushSubs = await getPushSubscriptionsForUsers(recipientsResult.pushRecipients.map((r) => r.id));
        await sendPushNotifications({
          subscriptions: pushSubs,
          title: recipientsResult.title || assignment.title,
          body: recipientsResult.body?.slice(0, 140) || assignment.description || 'New assignment posted',
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
    }
    return NextResponse.json({ assignment });
  } catch (e) {
    reportError(e, { route: 'POST /api/assignments' });
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
