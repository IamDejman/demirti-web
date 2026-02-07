import { NextResponse } from 'next/server';
import { getCohortById, updateCohort, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { requireAdminOrUser } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    const isAdmin = user.role === 'admin';
    const isStudent = await isStudentInCohort(id, user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ cohort: { ...cohort, facilitators } });
  } catch (e) {
    console.error('GET /api/cohorts/[id]:', e);
    return NextResponse.json({ error: 'Failed to fetch cohort' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updated = await updateCohort(id, {
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      currentWeek: body.currentWeek,
      status: body.status,
    });
    return NextResponse.json({ cohort: updated });
  } catch (e) {
    console.error('PUT /api/cohorts/[id]:', e);
    return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
  }
}
