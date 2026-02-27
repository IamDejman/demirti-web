import { NextResponse } from 'next/server';
import { createPresignedGetUrl, isStorageConfigured } from '@/lib/storage';
import { reportError } from '@/lib/logger';

const EXT_TO_CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

/**
 * File proxy route: serves files from private S3/R2 buckets.
 * Redirects to a presigned GET URL so the browser can load the file.
 * Cached for 1 hour via Cache-Control.
 */
export async function GET(request, { params }) {
  try {
    if (!isStorageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const { key: keyParts } = await params;
    if (!keyParts || keyParts.length === 0) {
      return NextResponse.json({ error: 'File key required' }, { status: 400 });
    }
    const key = keyParts.join('/');

    // Basic path traversal protection
    if (key.includes('..') || key.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    const presignedUrl = createPresignedGetUrl({ key, expiresInSeconds: 3600 });

    // Determine content type for the response hint
    const ext = key.includes('.') ? key.split('.').pop().toLowerCase() : '';
    const contentType = EXT_TO_CONTENT_TYPE[ext] || 'application/octet-stream';

    // Redirect to the presigned URL
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: presignedUrl,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': contentType,
      },
    });
  } catch (e) {
    reportError(e, { route: 'GET /api/uploads/[...key]' });
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
