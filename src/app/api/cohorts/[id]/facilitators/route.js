import { NextResponse } from 'next/server';
import { addCohortFacilitator, getCohortById, getCohortFacilitators, removeCohortFacilitator } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail, createUser } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendFacilitatorWelcomeEmail } from '@/lib/notifications';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    return NextResponse.json({ facilitators });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts/[id]/facilitators' });
    return NextResponse.json({ error: 'Failed to fetch facilitators' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const body = await request.json();
    const { facilitatorId, email, firstName, lastName } = body;
    let userId = facilitatorId;
    let tempPassword = null;
    let facilitatorUser = null;
    let isNewUser = false;
    if (!userId && email) {
      let user = await getUserByEmail(email);
      if (!user) {
        isNewUser = true;
        tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        user = await createUser({
          email: email.trim(),
          password: null,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          role: 'facilitator',
        });
        await sql`UPDATE users SET password_hash = ${passwordHash}, must_change_password = true WHERE id = ${user.id}`;
      } else if (user.role !== 'facilitator') {
        await sql`UPDATE users SET role = 'facilitator' WHERE id = ${user.id}`;
      }
      facilitatorUser = user;
      userId = user.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'facilitatorId or email is required' }, { status: 400 });
    }
    const facilitators = await addCohortFacilitator(id, userId);

    recordAuditLog({
      userId: String(admin.id),
      action: 'facilitator.assigned',
      targetType: 'cohort',
      targetId: id,
      details: { facilitator_email: facilitatorUser?.email || email, cohort_name: cohort.name, is_new_user: isNewUser },
      actorEmail: admin.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    if (facilitatorUser) {
      sendFacilitatorWelcomeEmail({
        recipient: facilitatorUser,
        cohort,
        tempPassword: isNewUser ? tempPassword : null,
      }).catch((err) => reportError(err, { route: 'POST /api/cohorts/[id]/facilitators', context: 'email' }));
    }
    return NextResponse.json({ facilitators });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts/[id]/facilitators' });
    return NextResponse.json({ error: 'Failed to add facilitator' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const body = await request.json();
    const { facilitatorId } = body;
    if (!facilitatorId) {
      return NextResponse.json({ error: 'facilitatorId is required' }, { status: 400 });
    }
    await removeCohortFacilitator(id, facilitatorId);
    const facilitators = await getCohortFacilitators(id);

    recordAuditLog({
      userId: String(admin.id),
      action: 'facilitator.removed',
      targetType: 'cohort',
      targetId: id,
      details: { facilitator_id: facilitatorId },
      actorEmail: admin.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ facilitators });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/cohorts/[id]/facilitators' });
    return NextResponse.json({ error: 'Failed to remove facilitator' }, { status: 500 });
  }
}
