import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getAllGoals, createGoal } from '@/lib/db';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const goals = await getAllGoals();
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json({ error: 'Failed to load goals', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, type, matchValue, matchType = 'contains' } = body;
    if (!name || !type || !matchValue) {
      return NextResponse.json({ error: 'name, type, and matchValue are required' }, { status: 400 });
    }
    const goal = await createGoal({ name, type, matchValue, matchType });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json({ error: 'Failed to create goal', details: error.message }, { status: 500 });
  }
}
