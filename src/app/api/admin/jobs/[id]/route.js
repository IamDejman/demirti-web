import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    const body = await request.json();
    const { title, company, location, employmentType, salaryRange, description, externalUrl, trackId, isActive } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const result = await sql`
      UPDATE jobs
      SET title = ${title.trim()},
          company = ${company || null},
          location = ${location || null},
          employment_type = ${employmentType || null},
          salary_range = ${salaryRange || null},
          description = ${description || null},
          external_url = ${externalUrl || null},
          track_id = ${trackId ? parseInt(trackId, 10) : null},
          is_active = ${isActive !== false},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'job.update',
      targetType: 'job',
      targetId: id,
      details: { title: result.rows[0].title },
      ipAddress,
    });
    return NextResponse.json({ job: result.rows[0] });
  } catch (e) {
    reportError(e, { route: 'PUT /api/admin/jobs/[id]' });
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM jobs WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'job.delete',
      targetType: 'job',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    reportError(e, { route: 'DELETE /api/admin/jobs/[id]' });
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
