import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getFunnelPerformance } from '@/lib/analyticsQueries';

export async function GET(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid funnel id' }, { status: 400 });
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const data = await getFunnelPerformance(id, start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics funnel error:', error);
    return NextResponse.json({ error: 'Failed to load funnel', details: error.message }, { status: 500 });
  }
}
