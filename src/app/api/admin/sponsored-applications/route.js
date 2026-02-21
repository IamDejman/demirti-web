import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { reportError } from '@/lib/logger';
import { getAllSponsoredApplications } from '@/lib/db';

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const reviewStatus = searchParams.get('reviewStatus') || null;
    const cohortName = searchParams.get('cohortName') || null;

    const filters = {};
    if (reviewStatus) filters.reviewStatus = reviewStatus;
    if (cohortName) filters.cohortName = cohortName;

    const applications = await getAllSponsoredApplications(filters);
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    reportError(error, { route: 'GET /api/admin/sponsored-applications' });
    return NextResponse.json(
      { error: 'Failed to fetch sponsored applications' },
      { status: 500 }
    );
  }
}
