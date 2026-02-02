import { NextResponse } from 'next/server';
import { createAssignment, getAssignmentById, getWeekById, getCohortFacilitators } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const weekId = (await request.json()).weekId;
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 });
    const week = await getWeekById(weekId);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const {
      weekId: wId,
      cohortId,
      title,
      description,
      submissionType,
      allowedFileTypes,
      maxFileSizeMb,
      deadlineAt,
      maxScore,
      isPublished,
      publishAt,
    } = body;
    if (!title?.trim() || !deadlineAt) {
      return NextResponse.json({ error: 'title and deadlineAt are required' }, { status: 400 });
    }
    const assignment = await createAssignment({
      weekId: wId || weekId,
      cohortId: cohortId || week.cohort_id,
      title: title.trim(),
      description: description?.trim() || null,
      submissionType: submissionType || 'text',
      allowedFileTypes: Array.isArray(allowedFileTypes) ? allowedFileTypes : null,
      maxFileSizeMb: maxFileSizeMb ?? null,
      deadlineAt,
      maxScore: maxScore ?? 100,
      isPublished: isPublished ?? false,
      publishAt: publishAt || null,
      createdBy: user.id,
    });
    return NextResponse.json({ assignment });
  } catch (e) {
    console.error('POST /api/assignments:', e);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
