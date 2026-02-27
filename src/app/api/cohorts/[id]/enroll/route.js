import { NextResponse } from 'next/server';
import { getCohortById, enrollStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail, createUser } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEnrollmentEmail } from '@/lib/notifications';

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
    let isNewUser = false;
    let tempPassword = null;
    let enrolledUser = null;

    if (!userId && email) {
      let user = await getUserByEmail(email);
      if (!user) {
        // New user — generate temp password
        isNewUser = true;
        tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        user = await createUser({
          email: email.trim(),
          password: null,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          role: 'student',
        });
        // Set password hash and must_change_password
        await sql`UPDATE users SET password_hash = ${passwordHash}, must_change_password = true WHERE id = ${user.id}`;
      }
      enrolledUser = { email: user.email, first_name: user.first_name || firstName?.trim() || null };
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'studentId or email is required' }, { status: 400 });
    }

    if (!enrolledUser && email) {
      const existing = await getUserByEmail(email);
      if (existing) enrolledUser = { email: existing.email, first_name: existing.first_name };
    }

    const enrollment = await enrollStudentInCohort(id, userId, applicationId || null);

    // Send welcome/enrollment email (non-blocking)
    if (enrolledUser?.email) {
      sendEnrollmentEmail({
        recipient: enrolledUser,
        cohort,
        tempPassword: isNewUser ? tempPassword : null,
      }).catch((err) => reportError(err, { route: 'POST /api/cohorts/[id]/enroll', context: 'sendEnrollmentEmail (non-blocking)' }));
    }

    return NextResponse.json({ enrollment });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts/[id]/enroll' });
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}
