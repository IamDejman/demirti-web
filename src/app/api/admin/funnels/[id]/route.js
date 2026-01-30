import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getFunnelById, updateFunnel, deleteFunnel } from '@/lib/db';

export async function GET(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid funnel id' }, { status: 400 });
    const funnel = await getFunnelById(id);
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error('Funnel GET error:', error);
    return NextResponse.json({ error: 'Failed to load funnel', details: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid funnel id' }, { status: 400 });
    const body = await request.json();
    const { name, steps } = body;
    const funnel = await updateFunnel(id, { name, steps });
    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error('Funnel PUT error:', error);
    return NextResponse.json({ error: 'Failed to update funnel', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid funnel id' }, { status: 400 });
    const funnel = await deleteFunnel(id);
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    return NextResponse.json({ success: true, deleted: funnel });
  } catch (error) {
    console.error('Funnel DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete funnel', details: error.message }, { status: 500 });
  }
}
