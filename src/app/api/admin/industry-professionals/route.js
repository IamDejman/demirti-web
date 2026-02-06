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
      FROM industry_professionals p
      LEFT JOIN tracks t ON t.id = p.track_id
      ORDER BY p.created_at DESC;
    `;
    return NextResponse.json({ professionals: result.rows });
  } catch (e) {
    console.error('GET /api/admin/industry-professionals:', e);
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, title, company, bio, photoUrl, linkedinUrl, trackId, isActive } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const result = await sql`
      INSERT INTO industry_professionals (name, title, company, bio, photo_url, linkedin_url, track_id, is_active)
      VALUES (
        ${name.trim()},
        ${title || null},
        ${company || null},
        ${bio || null},
        ${photoUrl || null},
        ${linkedinUrl || null},
        ${trackId ? parseInt(trackId, 10) : null},
        ${isActive !== false}
      )
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'professional.create',
      targetType: 'industry_professional',
      targetId: result.rows[0].id,
      details: { name: result.rows[0].name },
      ipAddress,
    });
    return NextResponse.json({ professional: result.rows[0] });
  } catch (e) {
    console.error('POST /api/admin/industry-professionals:', e);
    return NextResponse.json({ error: 'Failed to create professional' }, { status: 500 });
  }
}
