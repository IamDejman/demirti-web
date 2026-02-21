import { NextResponse } from 'next/server';
import { getContentItemById, updateContentItem, deleteContentItem, getWeekById, getCohortFacilitators } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    const item = await getContentItemById(id);
    if (!item) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    const week = await getWeekById(item.week_id);
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updated = await updateContentItem(id, {
      title: body.title,
      description: body.description,
      fileUrl: body.fileUrl,
      externalUrl: body.externalUrl,
      orderIndex: body.orderIndex,
      isDownloadable: body.isDownloadable,
    });
    return NextResponse.json({ contentItem: updated });
  } catch (e) {
    reportError(e, { route: 'PUT /api/content/[id]' });
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    const item = await getContentItemById(id);
    if (!item) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    const week = await getWeekById(item.week_id);
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await deleteContentItem(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/content/[id]' });
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
