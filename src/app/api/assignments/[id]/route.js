import { NextResponse } from 'next/server';
import { getAssignmentById, updateAssignment, deleteAssignment, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const [facilitators, isStudent] = await Promise.all([
      getCohortFacilitators(assignment.cohort_id),
      isStudentInCohort(assignment.cohort_id, user.id),
    ]);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ assignment });
  } catch (e) {
    reportError(e, { route: 'GET /api/assignments/[id]' });
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(assignment.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updated = await updateAssignment(id, {
      title: body.title,
      description: body.description,
      deadlineAt: body.deadlineAt,
      maxScore: body.maxScore,
      isPublished: body.isPublished,
      publishAt: body.publishAt,
    });
    return NextResponse.json({ assignment: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/assignments/[id]' });
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    const assignment = await getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(assignment.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await deleteAssignment(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/assignments/[id]' });
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
