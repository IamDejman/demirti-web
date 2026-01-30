import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getAnalyticsOverview } from '@/lib/analyticsQueries';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    let start, end;
    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    const compare = searchParams.get('compare') === 'true';
    const data = await getAnalyticsOverview(start, end, compare);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview', details: error.message }, { status: 500 });
  }
}
