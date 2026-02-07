import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getAllApplications } from '@/lib/db';
import { reportError } from '@/lib/logger';

// GET - Get all applications with filtering
export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    const status = searchParams.get('status'); // 'pending', 'paid', or null for all
    
    let applications = await getAllApplications();
    if (!Array.isArray(applications)) {
      applications = [];
    }
    
    // Filter by track if provided
    if (trackName) {
      applications = applications.filter(app => app?.track_name === trackName);
    }
    
    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app?.status === status);
    }
    
    // Calculate statistics
    const stats = {
      total: applications.length,
      paid: applications.filter(app => app?.status === 'paid').length,
      pending: applications.filter(app => app?.status === 'pending').length,
      totalRevenue: applications
        .filter(app => app?.status === 'paid' && app?.amount)
        .reduce((sum, app) => sum + (Number(app.amount) || 0) / 100, 0),
      byTrack: {}
    };
    
    // Group by track (safely handle null/undefined track_name)
    applications.forEach(app => {
      const track = app?.track_name ?? 'unknown';
      if (!stats.byTrack[track]) {
        stats.byTrack[track] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        };
      }
      stats.byTrack[track].total++;
      if (app?.status === 'paid') {
        stats.byTrack[track].paid++;
        if (app?.amount) {
          stats.byTrack[track].revenue += (Number(app.amount) || 0) / 100;
        }
      } else {
        stats.byTrack[track].pending++;
      }
    });
    
    return NextResponse.json({
      success: true,
      applications,
      stats
    });
  } catch (error) {
    const searchParams = new URL(request.url).searchParams;
    reportError(error, { route: '/api/admin/applications', track: searchParams.get('track') });
    return NextResponse.json(
      {
        error: 'Failed to get applications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

