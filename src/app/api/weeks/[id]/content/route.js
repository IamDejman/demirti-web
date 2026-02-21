import { NextResponse } from 'next/server';
import { getWeekById, createContentItem, getCohortFacilitators } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { type, title, description, fileUrl, externalUrl, orderIndex, isDownloadable } = body;
    if (!type || !title?.trim()) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }
    const item = await createContentItem({
      weekId: id,
      type,
      title: title.trim(),
      description: description?.trim() || null,
      fileUrl: fileUrl?.trim() || null,
      externalUrl: externalUrl?.trim() || null,
      orderIndex: orderIndex ?? 0,
      isDownloadable: isDownloadable ?? false,
    });
    return NextResponse.json({ contentItem: item });
  } catch (e) {
    reportError(e, { route: 'POST /api/weeks/[id]/content' });
    return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 });
  }
}
