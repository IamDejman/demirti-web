import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getEventsExplorer } from '@/lib/analyticsQueries';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
    const eventName = searchParams.get('event') || null;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const data = await getEventsExplorer(start, end, eventName);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics event-log error:', error);
    return NextResponse.json({ error: 'Failed to load event log', details: error.message }, { status: 500 });
  }
}
