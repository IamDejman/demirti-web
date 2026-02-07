import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getRealtime } from '@/lib/analyticsQueries';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await getRealtime();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics realtime error:', error);
    return NextResponse.json({ error: 'Failed to load realtime', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 500 });
  }
}
