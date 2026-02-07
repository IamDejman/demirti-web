import { NextResponse } from 'next/server';
import { getMaterialById, updateMaterial, deleteMaterial, getWeekById, getCohortFacilitators } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Material ID required' }, { status: 400 });
    const material = await getMaterialById(id);
    if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    const week = await getWeekById(material.week_id);
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updated = await updateMaterial(id, {
      title: body.title,
      description: body.description,
      url: body.url,
      fileUrl: body.fileUrl,
      type: body.type,
    });
    return NextResponse.json({ material: updated });
  } catch (e) {
    console.error('PUT /api/materials/[id]:', e);
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAdminOrUserFromRequest(request) || (await getUserFromRequest(request));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Material ID required' }, { status: 400 });
    const material = await getMaterialById(id);
    if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    const week = await getWeekById(material.week_id);
    const facilitators = await getCohortFacilitators(week.cohort_id);
    const isFacilitator = user.role === 'facilitator' && facilitators.some((f) => f.id === user.id);
    if (user.role !== 'admin' && !isFacilitator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await deleteMaterial(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/materials/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
