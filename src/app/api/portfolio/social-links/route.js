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
      SELECT * FROM portfolio_social_links
      WHERE portfolio_id = ${portfolio.id}
      ORDER BY id ASC;
    `;
    return NextResponse.json({ links: result.rows });
  } catch (e) {
    console.error('GET /api/portfolio/social-links:', e);
    return NextResponse.json({ error: 'Failed to fetch social links' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { platform, url } = body;
    if (!platform?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'platform and url are required' }, { status: 400 });
    }
    await ensureLmsSchema();
    const portfolio = await ensurePortfolio(user.id);
    const result = await sql`
      INSERT INTO portfolio_social_links (portfolio_id, platform, url)
      VALUES (${portfolio.id}, ${platform.trim()}, ${url.trim()})
      RETURNING *;
    `;
    return NextResponse.json({ link: result.rows[0] });
  } catch (e) {
    console.error('POST /api/portfolio/social-links:', e);
    return NextResponse.json({ error: 'Failed to create social link' }, { status: 500 });
  }
}
