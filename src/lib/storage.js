/**
 * File storage helper for assignment uploads and other assets.
 * Configure S3/R2 via env: STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY,
 * and optionally STORAGE_ENDPOINT for R2. If not configured, returns a placeholder path.
 */

import crypto from 'crypto';

const BASE_URL = process.env.STORAGE_PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Generate a unique storage key for an upload (e.g. assignments/cohortId/assignmentId/studentId-timestamp.ext).
 */
export function generateUploadKey(prefix = 'assignments', extension = '') {
  const id = crypto.randomBytes(16).toString('hex');
  const ext = extension ? (extension.startsWith('.') ? extension : `.${extension}`) : '';
  return `${prefix}/${id}${ext}`;
}

/**
 * Return a public URL for a stored file. When S3/R2 is configured, this would be the CDN or bucket URL.
 * For MVP without S3/R2, we store the key and the client can upload via a presigned URL endpoint later.
 */
export function getPublicUrl(key) {
  if (!key) return null;
  if (BASE_URL) {
    return `${BASE_URL.replace(/\/$/, '')}/api/uploads/${encodeURIComponent(key)}`;
  }
  return `/api/uploads/${encodeURIComponent(key)}`;
}

/**
 * Validate file type against allowed list (e.g. ['pdf', 'zip', 'png']).
 */
export function isAllowedFileType(filenameOrExt, allowedTypes) {
  if (!allowedTypes || !Array.isArray(allowedTypes) || allowedTypes.length === 0) return true;
  const ext = filenameOrExt.includes('.') ? filenameOrExt.split('.').pop().toLowerCase() : filenameOrExt.toLowerCase();
  return allowedTypes.map((t) => t.toLowerCase().replace(/^\./, '')).includes(ext);
}

/**
 * Validate file size (bytes) against max MB.
 */
export function isWithinSizeLimit(bytes, maxMb) {
  if (maxMb == null) return true;
  return bytes <= (maxMb * 1024 * 1024);
}
