import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema, createJobApplication, recordLmsEvent } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request, { params }) {
  try {
    const { id: jobId } = await params;
    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    await ensureLmsSchema();
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const limiter = await rateLimit(`job_apply_${ip}`, { windowMs: 10 * 60_000, limit: 10 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many applications from this IP. Try later.' }, { status: 429 });
    }

    const jobRes = await sql`
      SELECT id, title, is_active
      FROM jobs
      WHERE id = ${jobId}
      LIMIT 1;
    `;
    const job = jobRes.rows[0];
    if (!job || job.is_active === false) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const user = await getUserFromRequest(request);
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const resumeUrl = (body.resumeUrl || '').trim();
    const portfolioUrl = (body.portfolioUrl || '').trim();
    const coverLetter = (body.coverLetter || '').trim();

    if (!user && (!name || !email)) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const applicantName = name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || null;
    const applicantEmail = email || user?.email || null;

    const application = await createJobApplication({
      jobId,
      userId: user?.id || null,
      name: applicantName,
      email: applicantEmail,
      resumeUrl: resumeUrl || null,
      portfolioUrl: portfolioUrl || null,
      coverLetter: coverLetter || null,
    });

    if (user?.id) {
      await recordLmsEvent(user.id, 'job_application_submitted', { jobId });
    }

    return NextResponse.json({ application });
  } catch (e) {
    console.error('POST /api/jobs/[id]/apply:', e);
    return NextResponse.json({ error: 'Failed to apply for job' }, { status: 500 });
  }
}
