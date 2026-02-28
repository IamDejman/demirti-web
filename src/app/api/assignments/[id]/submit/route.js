import { NextResponse } from 'next/server';
import { getAssignmentById, getSubmissionByAssignmentAndStudent, createSubmission, recordLmsEvent, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { isAllowedFileType, isWithinSizeLimit } from '@/lib/storage';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Only students can submit' }, { status: 403 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const inCohort = await isStudentInCohort(assignment.cohort_id, user.id);
    if (!inCohort) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!assignment.is_published && assignment.publish_at && new Date(assignment.publish_at) > new Date()) {
      return NextResponse.json({ error: 'Assignment not yet published' }, { status: 403 });
    }
    if (new Date(assignment.deadline_at) < new Date()) {
      return NextResponse.json({ error: 'Deadline has passed' }, { status: 400 });
    }
    const existing = await getSubmissionByAssignmentAndStudent(id, user.id);
    if (existing && existing.status === 'graded') {
      return NextResponse.json({ error: 'Already submitted and graded' }, { status: 400 });
    }
    const body = await request.json();
    const { submissionType, fileUrl, linkUrl, textContent, fileName, fileSize } = body;
    if (!submissionType && !fileUrl && !linkUrl && !textContent) {
      return NextResponse.json({ error: 'Provide submissionType and at least one of fileUrl, linkUrl, or textContent' }, { status: 400 });
    }
    const typeCheckTarget = fileName || fileUrl;
    if (fileUrl && assignment.allowed_file_types?.length && !isAllowedFileType(typeCheckTarget, assignment.allowed_file_types)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }
    if (fileUrl && assignment.max_file_size_mb != null && fileSize != null && !isWithinSizeLimit(fileSize, assignment.max_file_size_mb)) {
      return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
    }
    const submission = await createSubmission({
      assignmentId: id,
      studentId: user.id,
      submissionType: submissionType || (fileUrl ? 'file_upload' : linkUrl ? 'link' : 'text'),
      fileUrl: fileUrl || null,
      linkUrl: linkUrl || null,
      textContent: textContent || null,
    });
    await recordLmsEvent(user.id, 'assignment_submitted', { assignmentId: id, submissionId: submission.id });

    recordAuditLog({
      userId: String(user.id),
      action: 'assignment.submitted',
      targetType: 'assignment_submission',
      targetId: String(submission.id),
      details: { assignment_id: id, cohort_id: assignment.cohort_id, submission_type: submission.submission_type },
      actorEmail: user.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ submission });
  } catch (e) {
    reportError(e, { route: 'POST /api/assignments/[id]/submit' });
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
