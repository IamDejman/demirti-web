import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { sqlRead } from '@/lib/db-read';
import crypto from 'crypto';
import { ensureLmsSchema, recordLmsEvent } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

function normalizeSlug(slug) {
  if (!slug) return null;
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeDomain(domain) {
  if (!domain) return null;
  let value = domain.toLowerCase().trim();
  value = value.replace(/^https?:\/\//, '');
  value = value.split('/')[0];
  value = value.split(':')[0];
  return value || null;
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const portfolioRes = await sqlRead`
      SELECT * FROM portfolios WHERE user_id = ${user.id} LIMIT 1;
    `;
    const portfolio = portfolioRes.rows[0] || null;
    if (!portfolio) {
      return NextResponse.json({ portfolio: null, projects: [], socialLinks: [] });
    }
    const [projectsRes, linksRes] = await Promise.all([
      sqlRead`SELECT * FROM portfolio_projects WHERE portfolio_id = ${portfolio.id} ORDER BY order_index ASC;`,
      sqlRead`SELECT * FROM portfolio_social_links WHERE portfolio_id = ${portfolio.id} ORDER BY id ASC;`,
    ]);
    return NextResponse.json({ portfolio, projects: projectsRes.rows, socialLinks: linksRes.rows });
  } catch (e) {
    console.error('GET /api/portfolio:', e);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { headline, bio, resumeUrl, isPublic, customDomain } = body;
    const slug = normalizeSlug(body.slug);
    const normalizedDomain = normalizeDomain(customDomain);
    await ensureLmsSchema();
    if (slug) {
      const existing = await sql`
        SELECT id FROM portfolios WHERE slug = ${slug} AND user_id <> ${user.id} LIMIT 1;
      `;
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 });
      }
    }
    const existingRes = await sql`
      SELECT custom_domain, domain_verification_token, domain_verified_at
      FROM portfolios
      WHERE user_id = ${user.id}
      LIMIT 1;
    `;
    const existing = existingRes.rows[0];
    let domainToken = existing?.domain_verification_token || null;
    let domainVerifiedAt = existing?.domain_verified_at || null;
    if (normalizedDomain) {
      if (!existing || existing.custom_domain !== normalizedDomain) {
        domainToken = crypto.randomBytes(16).toString('hex');
        domainVerifiedAt = null;
      }
    } else {
      domainToken = null;
      domainVerifiedAt = null;
    }
    const result = await sql`
      INSERT INTO portfolios (user_id, slug, custom_domain, domain_verification_token, domain_verified_at, headline, bio, resume_url, is_public, updated_at)
      VALUES (
        ${user.id},
        ${slug},
        ${normalizedDomain},
        ${domainToken},
        ${domainVerifiedAt},
        ${headline || null},
        ${bio || null},
        ${resumeUrl || null},
        ${isPublic === true},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        slug = EXCLUDED.slug,
        custom_domain = EXCLUDED.custom_domain,
        domain_verification_token = EXCLUDED.domain_verification_token,
        domain_verified_at = EXCLUDED.domain_verified_at,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        resume_url = EXCLUDED.resume_url,
        is_public = EXCLUDED.is_public,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    await recordLmsEvent(user.id, 'portfolio_updated', { isPublic: isPublic === true });
    return NextResponse.json({ portfolio: result.rows[0] });
  } catch (e) {
    console.error('POST /api/portfolio:', e);
    return NextResponse.json({ error: 'Failed to save portfolio' }, { status: 500 });
  }
}
