import { NextResponse } from 'next/server';
import { getCohorts, getCohortsForUser, createCohort, getCohortById } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    const user = admin || (await getUserFromRequest(request));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const trackId = searchParams.get('trackId');
    let cohorts;
    if (admin) {
      cohorts = await getCohorts({ status: status || undefined, trackId: trackId ? parseInt(trackId, 10) : undefined });
    } else {
      cohorts = await getCohortsForUser(user.id, user.role);
    }
    return NextResponse.json({ cohorts });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts' });
    return NextResponse.json({ error: 'Failed to fetch cohorts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { trackId, name, startDate, endDate, status } = body;
    if (!trackId || !name?.trim() || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'trackId, name, startDate, and endDate are required' },
        { status: 400 }
      );
    }
    const cohort = await createCohort({
      trackId: parseInt(trackId, 10),
      name: name.trim(),
      startDate,
      endDate,
      status: status || 'upcoming',
    });
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    try {
      await recordAuditLog({
        userId: admin.id,
        action: 'cohort.create',
        targetType: 'cohort',
        targetId: cohort.id,
        details: { name: cohort.name },
        ipAddress,
        actorEmail: admin.email,
      });
    } catch (auditErr) {
      reportError(auditErr, { route: 'POST /api/cohorts', context: 'audit log cohort.create (non-blocking)' });
    }
    const fullCohort = await getCohortById(cohort.id) || cohort;
    return NextResponse.json({ cohort: fullCohort });
  } catch (e) {
    reportError(e, { route: 'POST /api/cohorts' });
    return NextResponse.json({ error: 'Failed to create cohort' }, { status: 500 });
  }
}
