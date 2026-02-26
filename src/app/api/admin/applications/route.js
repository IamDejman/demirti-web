import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getAllApplications, deleteApplication, bulkDeleteApplications } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/api-helpers';
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
    reportError(error, { route: 'GET /api/admin/applications', track: searchParams.get('track') });
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}

// DELETE - Delete unpaid application(s). Body: { id } for single, { ids: [...] } for bulk
export async function DELETE(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ip = getClientIp(request);

    // Bulk delete
    if (Array.isArray(body.ids)) {
      if (body.ids.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
      }
      const deletedCount = await bulkDeleteApplications(body.ids);
      recordAuditLog({
        userId: admin.id,
        action: 'application.bulk_delete',
        targetType: 'application',
        details: { requestedIds: body.ids, deletedCount },
        ipAddress: ip,
      }).catch(() => {});
      return NextResponse.json({ success: true, deletedCount });
    }

    // Single delete
    if (body.id) {
      const deleted = await deleteApplication(body.id);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Application not found or is paid and cannot be deleted' },
          { status: 400 }
        );
      }
      recordAuditLog({
        userId: admin.id,
        action: 'application.delete',
        targetType: 'application',
        targetId: body.id,
        details: { email: deleted.email, track: deleted.track_name },
        ipAddress: ip,
      }).catch(() => {});
      return NextResponse.json({ success: true, deletedCount: 1 });
    }

    return NextResponse.json({ error: 'Provide id or ids' }, { status: 400 });
  } catch (error) {
    reportError(error, { route: 'DELETE /api/admin/applications' });
    return NextResponse.json({ error: 'Failed to delete applications' }, { status: 500 });
  }
}

