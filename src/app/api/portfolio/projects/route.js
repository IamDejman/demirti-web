import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { stripHtml } from '@/lib/sanitize';

async function ensurePortfolio(userId) {
  const existing = await sql`SELECT * FROM portfolios WHERE user_id = ${userId} LIMIT 1;`;
  if (existing.rows[0]) return existing.rows[0];
  const created = await sql`
    INSERT INTO portfolios (user_id, is_public)
    VALUES (${userId}, false)
    RETURNING *;
  `;
  return created.rows[0];
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const portfolio = await ensurePortfolio(user.id);
    const result = await sql`
      SELECT * FROM portfolio_projects
      WHERE portfolio_id = ${portfolio.id}
      ORDER BY order_index ASC;
    `;
    return NextResponse.json({ projects: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/portfolio/projects' });
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { linkUrl, imageUrl, orderIndex } = body;
    const title = body.title ? stripHtml(body.title) : '';
    const description = body.description ? stripHtml(body.description) : null;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const portfolio = await ensurePortfolio(user.id);
    const result = await sql`
      INSERT INTO portfolio_projects (portfolio_id, title, description, link_url, image_url, order_index)
      VALUES (
        ${portfolio.id},
        ${title.trim()},
        ${description || null},
        ${linkUrl || null},
        ${imageUrl || null},
        ${Number.isFinite(orderIndex) ? orderIndex : 0}
      )
      RETURNING *;
    `;
    return NextResponse.json({ project: result.rows[0] });
  } catch (e) {
    reportError(e, { route: 'POST /api/portfolio/projects' });
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
