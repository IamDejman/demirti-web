import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getPages } from '@/lib/analyticsQueries';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const data = await getPages(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics pages error:', error);
    return NextResponse.json({ error: 'Failed to load pages', details: error.message }, { status: 500 });
  }
}
