import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSubmissionById, gradeSubmission, getAssignmentById, getCohortFacilitators, createGradeNotification, getPushSubscriptionsForUsers, recordLmsEvent } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { sendGradeEmail } from '@/lib/notifications';
import { sendPushNotifications } from '@/lib/push';

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    const submission = await getSubmissionById(id);
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    const assignment = await getAssignmentById(submission.assignment_id);
    const facilitators = await getCohortFacilitators(assignment.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { score, feedback } = body;
    if (score == null || score < 0 || score > (assignment.max_score ?? 100)) {
      return NextResponse.json({ error: 'Valid score required' }, { status: 400 });
    }
    const updated = await gradeSubmission(id, {
      score: parseInt(score, 10),
      feedback: feedback?.trim() || null,
      gradedBy: user.id,
    });
    await recordLmsEvent(user.id, 'assignment_graded', { submissionId: id, assignmentId: assignment.id, studentId: submission.student_id });
    const gradeNotif = await createGradeNotification({
      assignment,
      studentId: submission.student_id,
      score: parseInt(score, 10),
    });
    if (gradeNotif?.emailEnabled) {
      const recipientRes = await sql`SELECT id, email, first_name, last_name FROM users WHERE id = ${submission.student_id} LIMIT 1;`;
      const recipient = recipientRes.rows[0];
      if (recipient) {
        await sendGradeEmail({
          recipient,
          assignment,
          title: gradeNotif.template?.title,
          body: gradeNotif.template?.body || feedback || `Score: ${score}`,
        });
      }
    }
    if (gradeNotif?.pushEnabled) {
      const pushSubs = await getPushSubscriptionsForUsers([submission.student_id]);
      await sendPushNotifications({
        subscriptions: pushSubs,
        title: gradeNotif.template?.title || `Graded: ${assignment.title}`,
        body: gradeNotif.template?.body || `Score: ${score}`,
        url: '/dashboard/assignments',
      });
    }
    return NextResponse.json({ submission: updated });
  } catch (e) {
    console.error('POST /api/submissions/[id]/grade:', e);
    return NextResponse.json({ error: 'Failed to grade' }, { status: 500 });
  }
}
