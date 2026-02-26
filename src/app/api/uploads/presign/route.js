import { NextResponse } from 'next/server';
import { createPresignedUploadUrl, generateUploadKey, isAllowedFileType, isWithinSizeLimit, isStorageConfigured } from '@/lib/storage';
import { reportError } from '@/lib/logger';
import { requireAdminOrUser } from '@/lib/adminAuth';

const ALLOWED_PREFIXES = ['assignments', 'profile', 'profiles', 'portfolios', 'materials', 'certificates'];
const SERVER_ALLOWED_TYPES = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'csv', 'xlsx', 'pptx', 'mp4', 'zip'];
const SERVER_MAX_SIZE_MB = 50;

export async function POST(request) {
  try {
    const [, authError] = await requireAdminOrUser(request);
    if (authError) return authError;

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: 'File storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY in your environment.' },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { filename, contentType, prefix, fileSize } = body;
    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    if (!isAllowedFileType(filename, SERVER_ALLOWED_TYPES)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }
    if (fileSize != null && !isWithinSizeLimit(fileSize, SERVER_MAX_SIZE_MB)) {
      return NextResponse.json({ error: `File size exceeds ${SERVER_MAX_SIZE_MB}MB limit` }, { status: 400 });
    }

    const safePrefix = ALLOWED_PREFIXES.includes(prefix) ? prefix : 'assignments';
    const extension = filename.includes('.') ? filename.split('.').pop() : '';
    const key = generateUploadKey(safePrefix, extension);
    const presigned = createPresignedUploadUrl({ key, contentType });
    return NextResponse.json({ key, ...presigned });
  } catch (e) {
    reportError(e, { route: 'POST /api/uploads/presign' });
    return NextResponse.json({ error: 'Failed to presign upload' }, { status: 500 });
  }
}
