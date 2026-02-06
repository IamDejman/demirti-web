import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

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
    console.error('GET /api/portfolio/projects:', e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, description, linkUrl, imageUrl, orderIndex } = body;
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
    console.error('POST /api/portfolio/projects:', e);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
