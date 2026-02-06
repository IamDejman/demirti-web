import { NextResponse } from 'next/server';
import { addCohortFacilitator, getCohortById, getCohortFacilitators, removeCohortFacilitator } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail, createUser } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function GET(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(id);
    return NextResponse.json({ facilitators });
  } catch (e) {
    console.error('GET /api/cohorts/[id]/facilitators:', e);
    return NextResponse.json({ error: 'Failed to fetch facilitators' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const cohort = await getCohortById(id);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const body = await request.json();
    const { facilitatorId, email, firstName, lastName } = body;
    let userId = facilitatorId;
    if (!userId && email) {
      let user = await getUserByEmail(email);
      if (!user) {
        user = await createUser({
          email: email.trim(),
          password: null,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          role: 'facilitator',
        });
      } else if (user.role !== 'facilitator') {
        await sql`UPDATE users SET role = 'facilitator' WHERE id = ${user.id}`;
      }
      userId = user.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'facilitatorId or email is required' }, { status: 400 });
    }
    const facilitators = await addCohortFacilitator(id, userId);
    return NextResponse.json({ facilitators });
  } catch (e) {
    console.error('POST /api/cohorts/[id]/facilitators:', e);
    return NextResponse.json({ error: 'Failed to add facilitator' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const body = await request.json();
    const { facilitatorId } = body;
    if (!facilitatorId) {
      return NextResponse.json({ error: 'facilitatorId is required' }, { status: 400 });
    }
    await removeCohortFacilitator(id, facilitatorId);
    const facilitators = await getCohortFacilitators(id);
    return NextResponse.json({ facilitators });
  } catch (e) {
    console.error('DELETE /api/cohorts/[id]/facilitators:', e);
    return NextResponse.json({ error: 'Failed to remove facilitator' }, { status: 500 });
  }
}
