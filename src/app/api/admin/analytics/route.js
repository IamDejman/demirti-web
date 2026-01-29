import { NextResponse } from 'next/server';
import {
  getPageViewsByDay,
  getTopPages,
  getEventCounts,
  getApplicationFunnelStats,
} from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const [pageViewsByDay, topPages, eventCounts, funnelStats] = await Promise.all([
      getPageViewsByDay(start, end),
      getTopPages(start, end, 20),
      getEventCounts(start, end),
      getApplicationFunnelStats(start, end),
    ]);

    const totalPageviews = pageViewsByDay.reduce((sum, row) => sum + row.pageviews, 0);
    const totalEvents = eventCounts.reduce((sum, row) => sum + row.count, 0);

    return NextResponse.json({
      success: true,
      range: { start: start.toISOString(), end: end.toISOString(), days },
      summary: { totalPageviews, totalEvents },
      pageViewsByDay,
      topPages,
      eventCounts,
      funnel: funnelStats,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics', details: error.message },
      { status: 500 }
    );
  }
}
