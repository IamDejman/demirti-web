import { NextResponse } from 'next/server';
import { getCohortById, getAssignmentsByCohort, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    // cohort_students.student_id is UUID; legacy admins have integer id, so skip student check for them
    const userIdIsUuid = user.id != null && /^[0-9a-f-]{36}$/i.test(String(user.id));
    const isStudentPromise = userIdIsUuid ? isStudentInCohort(id, user.id) : Promise.resolve(false);
    const [cohort, facilitators, isStudent, assignments] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
      isStudentPromise,
      getAssignmentsByCohort(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ assignments });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts/[id]/assignments' });
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
