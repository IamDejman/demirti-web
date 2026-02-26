import { NextResponse } from 'next/server';
import { getWeekById, createContentItem, createMaterial, getCohortFacilitators } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/weeks/[id]/bulk-content
 * Body: { items: [{ category: 'content'|'material', type, title, description?, fileUrl?, externalUrl?, url?, orderIndex?, isDownloadable? }] }
 * Creates multiple content items and/or materials in one request.
 */
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
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required and must not be empty' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 items per batch' }, { status: 400 });
    }

    const results = { created: 0, errors: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title?.trim()) {
        results.errors.push({ index: i, error: 'Title is required' });
        continue;
      }
      try {
        if (item.category === 'material') {
          await createMaterial({
            weekId: id,
            type: item.type || 'resource',
            title: item.title.trim(),
            description: item.description?.trim() || null,
            url: item.url?.trim() || null,
            fileUrl: item.fileUrl?.trim() || null,
          });
        } else {
          // Default to content
          await createContentItem({
            weekId: id,
            type: item.type || 'document',
            title: item.title.trim(),
            description: item.description?.trim() || null,
            fileUrl: item.fileUrl?.trim() || null,
            externalUrl: item.externalUrl?.trim() || null,
            orderIndex: item.orderIndex ?? i,
            isDownloadable: item.isDownloadable ?? false,
          });
        }
        results.created++;
      } catch (e) {
        results.errors.push({ index: i, error: e.message || 'Failed to create' });
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (e) {
    reportError(e, { route: 'POST /api/weeks/[id]/bulk-content' });
    return NextResponse.json({ error: 'Failed to bulk create content' }, { status: 500 });
  }
}
