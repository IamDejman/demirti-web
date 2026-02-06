import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = (searchParams.get('status') || '').trim();
    const rawLimit = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Number.isNaN(rawLimit) ? 200 : Math.min(Math.max(rawLimit, 1), 500);

    const result = await sql`
      SELECT ja.*, j.title AS job_title, u.email AS user_email
      FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      LEFT JOIN users u ON u.id = ja.user_id
      WHERE 1=1
        ${jobId ? sql`AND ja.job_id = ${jobId}` : sql``}
        ${status ? sql`AND ja.status = ${status}` : sql``}
      ORDER BY ja.created_at DESC
      LIMIT ${limit};
    `;
    return NextResponse.json({ applications: result.rows });
  } catch (e) {
    console.error('GET /api/admin/job-applications:', e);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
