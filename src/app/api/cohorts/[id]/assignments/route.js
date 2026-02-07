import { NextResponse } from 'next/server';
import { getCohortById, getAssignmentsByCohort, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isStudent = await isStudentInCohort(id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const assignments = await getAssignmentsByCohort(id);
    return NextResponse.json({ assignments });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/assignments:', e);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
