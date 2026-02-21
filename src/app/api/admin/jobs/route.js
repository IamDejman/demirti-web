import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const activeOnlyParam = searchParams.get('activeOnly') === 'true' ? true : null;
    const result = await sql`
      SELECT j.*, t.track_name
      FROM jobs j
      LEFT JOIN tracks t ON t.id = j.track_id
      WHERE (${activeOnlyParam}::boolean IS NULL OR j.is_active = true)
      ORDER BY j.created_at DESC;
    `;
    return NextResponse.json({ jobs: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/jobs' });
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, company, location, employmentType, salaryRange, description, externalUrl, trackId, isActive } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const result = await sql`
      INSERT INTO jobs (title, company, location, employment_type, salary_range, description, external_url, track_id, is_active)
      VALUES (
        ${title.trim()},
        ${company || null},
        ${location || null},
        ${employmentType || null},
        ${salaryRange || null},
        ${description || null},
        ${externalUrl || null},
        ${trackId ? parseInt(trackId, 10) : null},
        ${isActive !== false}
      )
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    try {
      await recordAuditLog({
        userId: typeof admin.id === 'string' && /^[0-9a-f-]{36}$/i.test(admin.id) ? admin.id : null,
        action: 'job.create',
        targetType: 'job',
        targetId: result.rows[0].id,
        details: { title: result.rows[0].title },
        ipAddress,
        actorEmail: admin.email,
      });
    } catch (auditErr) {
      reportError(auditErr, { route: 'POST /api/admin/jobs' });
    }
    return NextResponse.json({ job: result.rows[0] });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/jobs' });
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
