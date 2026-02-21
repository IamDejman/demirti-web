import { NextResponse } from 'next/server';
import { getCohortById, enrollStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail, createUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const body = await request.json();
    const { studentId, email, firstName, lastName, applicationId } = body;
    let userId = studentId;
    if (!userId && email) {
      let user = await getUserByEmail(email);
      if (!user) {
        user = await createUser({
          email: email.trim(),
          password: null,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          role: 'student',
        });
      }
      userId = user.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'studentId or email is required' }, { status: 400 });
    }
    const enrollment = await enrollStudentInCohort(id, userId, applicationId || null);
    return NextResponse.json({ enrollment });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts/[id]/enroll' });
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}
