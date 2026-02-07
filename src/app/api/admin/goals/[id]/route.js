import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getGoalById, updateGoal, deleteGoal } from '@/lib/db';

export async function GET(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const p = await params;
    const id = parseInt(p?.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 });
    const goal = await getGoalById(id);
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Goal GET error:', error);
    return NextResponse.json({ error: 'Failed to load goal', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const p = await params;
    const id = parseInt(p?.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 });
    const body = await request.json();
    const { name, type, matchValue, matchType } = body;
    const goal = await updateGoal(id, { name, type, matchValue, matchType });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Goal PUT error:', error);
    return NextResponse.json({ error: 'Failed to update goal', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const p = await params;
    const id = parseInt(p?.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 });
    const goal = await deleteGoal(id);
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    return NextResponse.json({ success: true, deleted: goal });
  } catch (error) {
    console.error('Goal DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete goal', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 500 });
  }
}
