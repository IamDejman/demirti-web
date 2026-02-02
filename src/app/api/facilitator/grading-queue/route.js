import { NextResponse } from 'next/server';
import { getPendingSubmissionsForFacilitator } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'facilitator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const submissions = await getPendingSubmissionsForFacilitator(user.id);
    return NextResponse.json({ submissions });
  } catch (e) {
    console.error('GET /api/facilitator/grading-queue:', e);
    return NextResponse.json({ error: 'Failed to fetch grading queue' }, { status: 500 });
  }
}
