import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function ensureOwnership(projectId, userId) {
  const res = await sql`
    SELECT p.id
    FROM portfolio_projects p
    JOIN portfolios f ON f.id = p.portfolio_id
    WHERE p.id = ${projectId} AND f.user_id = ${userId}
    LIMIT 1;
  `;
  return res.rows.length > 0;
}

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    const body = await request.json();
    const { title, description, linkUrl, imageUrl, orderIndex } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    if (!(await ensureOwnership(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await sql`
      UPDATE portfolio_projects
      SET title = ${title.trim()},
          description = ${description || null},
          link_url = ${linkUrl || null},
          image_url = ${imageUrl || null},
          order_index = ${Number.isFinite(orderIndex) ? orderIndex : 0}
      WHERE id = ${id}
      RETURNING *;
    `;
    return NextResponse.json({ project: result.rows[0] });
  } catch (e) {
    console.error('PUT /api/portfolio/projects/[id]:', e);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    await ensureLmsSchema();
    if (!(await ensureOwnership(id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await sql`DELETE FROM portfolio_projects WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/portfolio/projects/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
