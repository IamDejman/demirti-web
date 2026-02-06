import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
  try {
    const rawHost = request.headers.get('host');
    const host = rawHost ? rawHost.split(':')[0].toLowerCase() : null;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!host) return NextResponse.json({ error: 'Host not provided' }, { status: 400 });
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });
    await ensureLmsSchema();
    const res = await sql`
      SELECT id, domain_verification_token
      FROM portfolios
      WHERE custom_domain = ${host}
      LIMIT 1;
    `;
    const portfolio = res.rows[0];
    if (!portfolio || portfolio.domain_verification_token !== token) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }
    await sql`
      UPDATE portfolios
      SET domain_verified_at = CURRENT_TIMESTAMP
      WHERE id = ${portfolio.id};
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('GET /api/portfolio/verify-domain:', e);
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
  }
}
