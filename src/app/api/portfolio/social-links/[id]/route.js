import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function ensureOwnership(linkId, userId) {
  const res = await sql`
    SELECT l.id
    FROM portfolio_social_links l
    JOIN portfolios f ON f.id = l.portfolio_id
    WHERE l.id = ${linkId} AND f.user_id = ${userId}
    LIMIT 1;
  `;
  return res.rows.length > 0;
}

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    const body = await request.json();
    const { platform, url } = body;
    if (!platform?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'platform and url are required' }, { status: 400 });
    }
    await ensureLmsSchema();
    if (!(await ensureOwnership(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await sql`
      UPDATE portfolio_social_links
      SET platform = ${platform.trim()},
          url = ${url.trim()}
      WHERE id = ${id}
      RETURNING *;
    `;
    return NextResponse.json({ link: result.rows[0] });
  } catch (e) {
    console.error('PUT /api/portfolio/social-links/[id]:', e);
    return NextResponse.json({ error: 'Failed to update social link' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    await ensureLmsSchema();
    if (!(await ensureOwnership(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await sql`DELETE FROM portfolio_social_links WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/portfolio/social-links/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete social link' }, { status: 500 });
  }
}
