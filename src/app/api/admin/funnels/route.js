import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getAllFunnels, createFunnel } from '@/lib/db';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const funnels = await getAllFunnels();
    return NextResponse.json({ success: true, funnels });
  } catch (error) {
    console.error('Funnels GET error:', error);
    return NextResponse.json({ error: 'Failed to load funnels', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, steps } = body;
    if (!name || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'name and steps (array) are required' }, { status: 400 });
    }
    const funnel = await createFunnel({ name, steps });
    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error('Funnels POST error:', error);
    return NextResponse.json({ error: 'Failed to create funnel', details: error.message }, { status: 500 });
  }
}
