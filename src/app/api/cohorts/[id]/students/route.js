import { NextResponse } from 'next/server';
import { getCohortById, getCohortStudents } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const { getCohortFacilitators } = await import('@/lib/db-lms');
    const facilitators = await getCohortFacilitators(id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const students = await getCohortStudents(id);
    return NextResponse.json({ students });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/students:', e);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
