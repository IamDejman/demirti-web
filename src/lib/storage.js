/**
 * File storage helper for assignment uploads and other assets.
 * Configure S3/R2 via env: STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY,
 * and optionally STORAGE_ENDPOINT for R2. If not configured, returns a placeholder path.
 */

import crypto from 'crypto';

const PUBLIC_BASE_URL = process.env.STORAGE_PUBLIC_URL || '';
const FALLBACK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

function getStorageConfig() {
  return {
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    endpoint: process.env.STORAGE_ENDPOINT,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  };
}

export function isStorageConfigured() {
  const { bucket, region, accessKey, secretKey } = getStorageConfig();
  return Boolean(bucket && region && accessKey && secretKey);
}

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
  if (PUBLIC_BASE_URL) {
    return `${PUBLIC_BASE_URL.replace(/\/$/, '')}/${encodeKeyPath(key)}`;
  }
  const { bucket, region, endpoint, forcePathStyle } = getStorageConfig();
  if (bucket && region) {
    if (endpoint) {
      const base = endpoint.replace(/\/$/, '');
      if (forcePathStyle || !base.includes(bucket)) {
        return `${base}/${bucket}/${encodeKeyPath(key)}`;
      }
      return `${base}/${encodeKeyPath(key)}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodeKeyPath(key)}`;
  }
  if (FALLBACK_BASE_URL) {
    return `${FALLBACK_BASE_URL.replace(/\/$/, '')}/api/uploads/${encodeKeyPath(key)}`;
  }
  return `/api/uploads/${encodeKeyPath(key)}`;
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

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function hashSha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function hmac(key, str) {
  return crypto.createHmac('sha256', key).update(str, 'utf8').digest();
}

function getSignatureKey(secretKey, dateStamp, regionName, serviceName) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

function encodeKeyPath(key) {
  return key.split('/').map(encodeRfc3986).join('/');
}

export function createPresignedUploadUrl({ key, contentType, expiresInSeconds = 900 }) {
  const { bucket, region, accessKey, secretKey, endpoint, forcePathStyle } = getStorageConfig();
  if (!bucket || !region || !accessKey || !secretKey) {
    throw new Error('Storage not configured');
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  let host;
  let canonicalUri;
  let baseUrl;
  if (endpoint) {
    const url = new URL(endpoint);
    host = url.host;
    const basePath = url.pathname.replace(/\/$/, '');
    const keyPath = encodeKeyPath(key);
    if (forcePathStyle || !url.host.includes(bucket)) {
      canonicalUri = `${basePath}/${bucket}/${keyPath}`.replace(/\/{2,}/g, '/');
      baseUrl = `${url.protocol}//${host}${basePath}`;
    } else {
      canonicalUri = `${basePath}/${keyPath}`.replace(/\/{2,}/g, '/');
      baseUrl = `${url.protocol}//${host}${basePath}`;
    }
  } else {
    host = `${bucket}.s3.${region}.amazonaws.com`;
    canonicalUri = `/${encodeKeyPath(key)}`;
    baseUrl = `https://${host}`;
  }

  const queryParams = {
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${accessKey}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': `${expiresInSeconds}`,
    'X-Amz-SignedHeaders': 'host',
  };

  const canonicalQuerystring = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryParams[k])}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashSha256(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  const uploadUrl = `${baseUrl}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  return {
    uploadUrl,
    fileUrl: getPublicUrl(key),
    headers: contentType ? { 'Content-Type': contentType } : {},
    method: 'PUT',
  };
}
