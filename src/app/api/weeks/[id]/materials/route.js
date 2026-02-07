import { NextResponse } from 'next/server';
import { getWeekById, getMaterialsByWeek, createMaterial, getCohortFacilitators } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Week ID required' }, { status: 400 });
    const week = await getWeekById(id);
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    const materials = await getMaterialsByWeek(id);
    return NextResponse.json({ materials });
  } catch (e) {
    console.error('GET /api/weeks/[id]/materials:', e);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

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
    const { type, title, description, url, fileUrl } = body;
    if (!type || !title?.trim()) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }
    const material = await createMaterial({
      weekId: id,
      type,
      title: title.trim(),
      description: description?.trim() || null,
      url: url?.trim() || null,
      fileUrl: fileUrl?.trim() || null,
    });
    return NextResponse.json({ material });
  } catch (e) {
    console.error('POST /api/weeks/[id]/materials:', e);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}
