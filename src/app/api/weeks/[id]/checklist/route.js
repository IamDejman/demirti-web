import { NextResponse } from 'next/server';
import { getWeekById, getChecklistItemsByWeek, createChecklistItem, getCohortFacilitators, isStudentInCohort } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const [facilitators, isStudent, checklistItems] = await Promise.all([
      getCohortFacilitators(week.cohort_id),
      isStudentInCohort(week.cohort_id, user.id),
      getChecklistItemsByWeek(id),
    ]);
    const isAdmin = user.role === 'admin';
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (!isAdmin && !isFacilitator && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ checklistItems });
  } catch (e) {
    reportError(e, { route: 'GET /api/weeks/[id]/checklist' });
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const [user, errorRes] = await requireAdminOrUser(request);
    if (errorRes) return errorRes;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { title, orderIndex, isRequired } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    const item = await createChecklistItem({
      weekId: id,
      title: title.trim(),
      orderIndex: orderIndex ?? 0,
      isRequired: isRequired ?? true,
    });
    return NextResponse.json({ checklistItem: item });
  } catch (e) {
    reportError(e, { route: 'POST /api/weeks/[id]/checklist' });
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
}
