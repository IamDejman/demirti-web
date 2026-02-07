import { NextResponse } from 'next/server';
import { getAdminByToken } from '@/lib/admin';
import { getUserFromRequest } from '@/lib/auth';

/**
 * Get admin from request: Authorization Bearer token or cookie admin_token.
 * Returns { id, email, first_name, last_name } or null.
 */
export async function getAdminFromRequest(request) {
  let token = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/admin_token=([^;]+)/);
      if (match) token = match[1].trim();
    }
  }
  if (!token) return null;
  return getAdminByToken(token);
}

/**
 * Get admin from request: either LMS user with role=admin (lms_token) or legacy admin (admin_token).
 * Returns { id, email, role: 'admin', first_name, last_name } or null.
 */
export async function getAdminOrUserFromRequest(request) {
  try {
    const user = await getUserFromRequest(request);
    if (user && user.role === 'admin') {
      return { id: user.id, email: user.email, role: 'admin', first_name: user.first_name, last_name: user.last_name };
    }
  } catch {
    // LMS auth failed (e.g. schema not initialized); fall through to legacy admin
  }
  const admin = await getAdminFromRequest(request);
  if (admin) {
    return { id: admin.id, email: admin.email, role: 'admin', first_name: admin.first_name, last_name: admin.last_name };
  }
  return null;
}

/**
 * Require admin auth. Returns [admin, null] or [null, 401 Response].
 */
export async function requireAdmin(request) {
  const admin = await getAdminOrUserFromRequest(request);
  if (!admin) return [null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
  return [admin, null];
}

/**
 * Require admin or LMS user. Returns [user, null] or [null, 401 Response].
 */
export async function requireAdminOrUser(request) {
  const admin = await getAdminOrUserFromRequest(request);
  if (admin) return [admin, null];
  const user = await getUserFromRequest(request);
  if (user) return [user, null];
  return [null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
}
