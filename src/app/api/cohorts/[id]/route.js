import { NextResponse } from 'next/server';
import { getCohortById, updateCohort, deleteCohort, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';
import { isValidUuid } from '@/lib/validation';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isAdmin = user.role === 'admin';
    if (isAdmin) return NextResponse.json({ cohort: { ...cohort, facilitators } });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    const isStudent = typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id)
      ? await isStudentInCohort(id, user.id)
      : false;
    if (!isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ cohort: { ...cohort, facilitators } });
  } catch (e) {
    reportError(e, { route: 'GET /api/cohorts/[id]' });
    return NextResponse.json({ error: 'Failed to fetch cohort' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
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
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    try {
      await recordAuditLog({
        userId: typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null,
        action: 'cohort.update',
        targetType: 'cohort',
        targetId: id,
        details: { name: updated.name },
        ipAddress,
        actorEmail: user.email,
      });
    } catch (auditErr) {
      reportError(auditErr, { route: 'PUT /api/cohorts/[id]', context: 'audit log cohort.update (non-blocking)' });
    }
    return NextResponse.json({ cohort: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/cohorts/[id]' });
    return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    const [cohort, facilitators] = await Promise.all([
      getCohortById(id),
      getCohortFacilitators(id),
    ]);
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => String(f.id) === String(user.id));
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const deleted = await deleteCohort(id);
    if (!deleted) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    try {
      await recordAuditLog({
        userId: typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null,
        action: 'cohort.delete',
        targetType: 'cohort',
        targetId: id,
        details: { name: deleted.name },
        ipAddress,
        actorEmail: user.email,
      });
    } catch (auditErr) {
      reportError(auditErr, { route: 'DELETE /api/cohorts/[id]', context: 'audit log cohort.delete (non-blocking)' });
    }
    return NextResponse.json({ deleted: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/cohorts/[id]' });
    return NextResponse.json({ error: 'Failed to delete cohort' }, { status: 500 });
  }
}
