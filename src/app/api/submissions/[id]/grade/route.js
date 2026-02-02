import { NextResponse } from 'next/server';
import { getSubmissionById, gradeSubmission, getAssignmentById, getCohortFacilitators } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

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
    return NextResponse.json({ submission: updated });
  } catch (e) {
    console.error('POST /api/submissions/[id]/grade:', e);
    return NextResponse.json({ error: 'Failed to grade' }, { status: 500 });
  }
}
