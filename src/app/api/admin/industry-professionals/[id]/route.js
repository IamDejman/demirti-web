import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Professional ID required' }, { status: 400 });
    const body = await request.json();
    const { name, title, company, bio, photoUrl, linkedinUrl, trackId, isActive } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const result = await sql`
      UPDATE industry_professionals
      SET name = ${name.trim()},
          title = ${title || null},
          company = ${company || null},
          bio = ${bio || null},
          photo_url = ${photoUrl || null},
          linkedin_url = ${linkedinUrl || null},
          track_id = ${trackId ? parseInt(trackId, 10) : null},
          is_active = ${isActive !== false}
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'professional.update',
      targetType: 'industry_professional',
      targetId: id,
      details: { name: result.rows[0].name },
      ipAddress,
    });
    return NextResponse.json({ professional: result.rows[0] });
  } catch (e) {
    console.error('PUT /api/admin/industry-professionals/[id]:', e);
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Professional ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM industry_professionals WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'professional.delete',
      targetType: 'industry_professional',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/industry-professionals/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete professional' }, { status: 500 });
  }
}
