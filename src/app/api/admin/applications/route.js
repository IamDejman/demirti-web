import { NextResponse } from 'next/server';
import { getAllApplications } from '@/lib/db';

// GET - Get all applications with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    const status = searchParams.get('status'); // 'pending', 'paid', or null for all
    
    let applications = await getAllApplications();
    
    // Filter by track if provided
    if (trackName) {
      applications = applications.filter(app => app.track_name === trackName);
    }
    
    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    
    // Calculate statistics
    const stats = {
      total: applications.length,
      paid: applications.filter(app => app.status === 'paid').length,
      pending: applications.filter(app => app.status === 'pending').length,
      totalRevenue: applications
        .filter(app => app.status === 'paid' && app.amount)
        .reduce((sum, app) => sum + (app.amount / 100), 0),
      byTrack: {}
    };
    
    // Group by track
    applications.forEach(app => {
      if (!stats.byTrack[app.track_name]) {
        stats.byTrack[app.track_name] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        };
      }
      stats.byTrack[app.track_name].total++;
      if (app.status === 'paid') {
        stats.byTrack[app.track_name].paid++;
        if (app.amount) {
          stats.byTrack[app.track_name].revenue += app.amount / 100;
        }
      } else {
        stats.byTrack[app.track_name].pending++;
      }
    });
    
    return NextResponse.json({
      success: true,
      applications,
      stats
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    return NextResponse.json(
      { error: 'Failed to get applications', details: error.message },
      { status: 500 }
    );
  }
}

