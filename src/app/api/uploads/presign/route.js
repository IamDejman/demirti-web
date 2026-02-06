import { NextResponse } from 'next/server';
import { createPresignedUploadUrl, generateUploadKey, isAllowedFileType, isWithinSizeLimit } from '@/lib/storage';

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType, prefix, allowedTypes, maxSizeMb, fileSize } = body;
    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    if (allowedTypes && !isAllowedFileType(filename, allowedTypes)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }
    if (fileSize != null && maxSizeMb != null && !isWithinSizeLimit(fileSize, maxSizeMb)) {
      return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
    }

    const extension = filename.includes('.') ? filename.split('.').pop() : '';
    const key = generateUploadKey(prefix || 'assignments', extension);
    const presigned = createPresignedUploadUrl({ key, contentType });
    return NextResponse.json({ key, ...presigned });
  } catch (e) {
    console.error('POST /api/uploads/presign:', e);
    const status = e.message === 'Storage not configured' ? 500 : 500;
    return NextResponse.json({ error: e.message || 'Failed to presign upload' }, { status });
  }
}
