import { NextResponse } from 'next/server';

/**
 * Extract the client IP address from the request.
 * Falls back to 'unknown' if no forwarded header is present.
 */
export function getClientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

/**
 * Return a standardized JSON success response.
 */
export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Return a standardized JSON error response.
 */
export function apiError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Aliases matching the names used in the Batch 8 plan. */
export const jsonError = apiError;
export const jsonSuccess = apiSuccess;

/**
 * Parse the request body as JSON, returning [body, null] on success
 * or [null, NextResponse] on failure.
 */
export async function parseBody(request) {
  try {
    const body = await request.json();
    return [body, null];
  } catch {
    return [null, apiError('Invalid JSON body', 400)];
  }
}
