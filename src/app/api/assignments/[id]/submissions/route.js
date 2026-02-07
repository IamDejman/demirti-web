import { NextResponse } from 'next/server';
import { getAssignmentById, getSubmissionsByAssignment, getCohortFacilitators } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(assignment.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const submissions = await getSubmissionsByAssignment(id);
    return NextResponse.json({ submissions });
  } catch (e) {
    console.error('GET /api/assignments/[id]/submissions:', e);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
