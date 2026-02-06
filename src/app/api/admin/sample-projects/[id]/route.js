import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    const body = await request.json();
    const { title, description, trackId, tags, thumbnailUrl, externalUrl, isActive } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const normalizedTags = Array.isArray(tags) ? tags : typeof tags === 'string' && tags.length > 0 ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null;
    const result = await sql`
      UPDATE sample_projects
      SET title = ${title.trim()},
          description = ${description || null},
          track_id = ${trackId ? parseInt(trackId, 10) : null},
          tags = ${normalizedTags},
          thumbnail_url = ${thumbnailUrl || null},
          external_url = ${externalUrl || null},
          is_active = ${isActive !== false}
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'sample_project.update',
      targetType: 'sample_project',
      targetId: id,
      details: { title: result.rows[0].title },
      ipAddress,
    });
    return NextResponse.json({ project: result.rows[0] });
  } catch (e) {
    console.error('PUT /api/admin/sample-projects/[id]:', e);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM sample_projects WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'sample_project.delete',
      targetType: 'sample_project',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/sample-projects/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
