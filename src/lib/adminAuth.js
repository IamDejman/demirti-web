import { getAdminByToken } from '@/lib/admin';

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
