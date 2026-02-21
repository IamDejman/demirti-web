import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError, logger } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { extractKeyFromUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureLmsSchema();

    const submissionUrls = await sql`
      SELECT file_url FROM assignment_submissions WHERE file_url IS NOT NULL AND file_url <> '';
    `;
    const projectUrls = await sql`
      SELECT image_url FROM portfolio_projects WHERE image_url IS NOT NULL AND image_url <> '';
    `;

    const inUseSubmissionUrls = submissionUrls.rows.map((r) => r.file_url).filter(Boolean);
    const inUseProjectUrls = projectUrls.rows.map((r) => r.image_url).filter(Boolean);
    const inUseKeys = new Set();
    for (const url of [...inUseSubmissionUrls, ...inUseProjectUrls]) {
      const key = extractKeyFromUrl(url);
      if (key) inUseKeys.add(key);
    }

    const orphaned = [];

    const summary = {
      in_use_submission_urls: inUseSubmissionUrls.length,
      in_use_project_urls: inUseProjectUrls.length,
      orphaned_count: orphaned.length,
      orphaned,
    };

    if (orphaned.length > 0) {
      logger.info('file-cleanup orphaned files', { count: orphaned.length, keys: orphaned });
    }

    return NextResponse.json(summary);
  } catch (e) {
    reportError(e, { route: 'GET /api/cron/file-cleanup' });
    return NextResponse.json({ error: 'Failed to run file cleanup' }, { status: 500 });
  }
}
