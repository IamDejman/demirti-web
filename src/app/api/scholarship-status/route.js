import { NextResponse } from 'next/server';
import { getScholarshipCount, incrementScholarshipCount, getTrackConfig } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { reportError } from '@/lib/logger';

// Cache duration: 30 seconds (revalidate every 30 seconds)
export const revalidate = 30;

// GET - Check scholarship availability for a specific track
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    
    if (!trackName) {
      return NextResponse.json(
        { error: 'Track name is required' },
        { status: 400 }
      );
    }

    // Get track configuration from database
    const trackConfig = await getTrackConfig(trackName);
    if (!trackConfig) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const scholarshipLimit = trackConfig.scholarship_limit || 10;
    const { count } = await getScholarshipCount(trackName);
    const available = count < scholarshipLimit;
    const remaining = Math.max(0, scholarshipLimit - count);
    
    const response = NextResponse.json({
      available,
      count,
      limit: scholarshipLimit,
      remaining,
      trackName,
      coursePrice: trackConfig.course_price,
      discountPercentage: trackConfig.scholarship_discount_percentage
    });

    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    reportError(error, { route: 'GET /api/scholarship-status' });
    return NextResponse.json(
      { error: 'Failed to check scholarship status' },
      { status: 500 }
    );
  }
}

// POST - Increment scholarship count (admin/internal only)
export async function POST(request) {
  const [, authErr] = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { trackName } = body;
    
    if (!trackName) {
      return NextResponse.json(
        { error: 'Track name is required' },
        { status: 400 }
      );
    }

    // Get track configuration from database
    const trackConfig = await getTrackConfig(trackName);
    if (!trackConfig) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const scholarshipLimit = trackConfig.scholarship_limit || 10;
    const { count } = await getScholarshipCount(trackName);
    
    if (count >= scholarshipLimit) {
      return NextResponse.json(
        { error: 'Scholarship limit reached for this track' },
        { status: 400 }
      );
    }
    
    const newCount = await incrementScholarshipCount(trackName);
    
    return NextResponse.json({
      success: true,
      count: newCount,
      remaining: scholarshipLimit - newCount,
      trackName
    });
  } catch (error) {
    reportError(error, { route: 'POST /api/scholarship-status' });
    return NextResponse.json(
      { error: 'Failed to update scholarship count' },

      { status: 500 }
    );
  }
}
