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
  const user = await getUserFromRequest(request);
  if (user && user.role === 'admin') {
    return { id: user.id, email: user.email, role: 'admin', first_name: user.first_name, last_name: user.last_name };
  }
  const admin = await getAdminFromRequest(request);
  if (admin) {
    return { id: admin.id, email: admin.email, role: 'admin', first_name: admin.first_name, last_name: admin.last_name };
  }
  return null;
}
