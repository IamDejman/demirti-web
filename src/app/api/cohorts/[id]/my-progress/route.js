import { NextResponse } from 'next/server';
import { getCohortById, getChecklistProgressForStudent } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const progress = await getChecklistProgressForStudent(id, user.id);
    return NextResponse.json({ progress });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/my-progress:', e);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
