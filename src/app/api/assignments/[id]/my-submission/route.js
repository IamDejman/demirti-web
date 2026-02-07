import { NextResponse } from 'next/server';
import { getAssignmentById, getSubmissionByAssignmentAndStudent, isStudentInCohort } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const inCohort = await isStudentInCohort(assignment.cohort_id, user.id);
    if (!inCohort) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const submission = await getSubmissionByAssignmentAndStudent(id, user.id);
    return NextResponse.json({ submission: submission || null });
  } catch (e) {
    console.error('GET /api/assignments/[id]/my-submission:', e);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}
