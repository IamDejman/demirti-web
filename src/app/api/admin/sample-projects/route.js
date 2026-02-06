import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const result = await sql`
      SELECT p.*, t.track_name
      FROM sample_projects p
      LEFT JOIN tracks t ON t.id = p.track_id
      ORDER BY p.created_at DESC;
    `;
    return NextResponse.json({ projects: result.rows });
  } catch (e) {
    console.error('GET /api/admin/sample-projects:', e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, description, trackId, tags, thumbnailUrl, externalUrl, isActive } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const normalizedTags = Array.isArray(tags) ? tags : typeof tags === 'string' && tags.length > 0 ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null;
    const result = await sql`
      INSERT INTO sample_projects (title, description, track_id, tags, thumbnail_url, external_url, is_active)
      VALUES (
        ${title.trim()},
        ${description || null},
        ${trackId ? parseInt(trackId, 10) : null},
        ${normalizedTags},
        ${thumbnailUrl || null},
        ${externalUrl || null},
        ${isActive !== false}
      )
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'sample_project.create',
      targetType: 'sample_project',
      targetId: result.rows[0].id,
      details: { title: result.rows[0].title },
      ipAddress,
    });
    return NextResponse.json({ project: result.rows[0] });
  } catch (e) {
    console.error('POST /api/admin/sample-projects:', e);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
