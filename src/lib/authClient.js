/**
 * Client-side auth headers for API requests.
 * - getAuthHeaders(): admin_token (admin routes)
 * - getLmsAuthHeaders(): lms_token (student/facilitator LMS routes)
 */
export function getAuthHeaders(tokenKey = 'admin_token') {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getLmsAuthHeaders() {
  return getAuthHeaders('lms_token');
}
