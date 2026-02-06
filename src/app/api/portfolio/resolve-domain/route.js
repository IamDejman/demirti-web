import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = (searchParams.get('host') || '').toLowerCase().trim().split(':')[0];
    if (!host) return NextResponse.json({ slug: null });
    await ensureLmsSchema();
    const res = await sql`
      SELECT slug
      FROM portfolios
      WHERE custom_domain = ${host}
        AND domain_verified_at IS NOT NULL
        AND is_public = true
      LIMIT 1;
    `;
    return NextResponse.json({ slug: res.rows[0]?.slug || null });
  } catch (e) {
    console.error('GET /api/portfolio/resolve-domain:', e);
    return NextResponse.json({ slug: null });
  }
}
