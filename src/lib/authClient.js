/**
 * Client-side auth headers for API requests.
 * - getAuthHeaders(): admin_token (admin routes)
 * - getLmsAuthHeaders(): lms_token (student/facilitator LMS routes)
 */

const SESSION_TIMED_OUT_MESSAGE = 'Session timed out';

/**
 * Clear admin auth and redirect to login with session timeout reason.
 * Call this when a 401 is received on admin API calls.
 */
export function handleAdmin401() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
  } catch {
    // ignore
  }
  const params = new URLSearchParams({ message: SESSION_TIMED_OUT_MESSAGE });
  window.location.href = `/admin/login?${params.toString()}`;
}

/**
 * Returns true if the request URL is for our app's API (so 401 should trigger admin logout).
 */
function isAppApiRequest(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/api/')) return true;
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin && u.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

/**
 * Wrap fetch so 401 on app API requests triggers admin logout and redirect with "Session timed out".
 * Call from admin layout (client) once on mount.
 */
export function installAdmin401Interceptor() {
  if (typeof window === 'undefined') return () => {};
  const originalFetch = window.fetch;
  window.fetch = function fetchWith401Handler(input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    return originalFetch.apply(this, arguments).then((response) => {
      if (response.status === 401 && isAppApiRequest(url)) {
        handleAdmin401();
      }
      return response;
    });
  };
  return () => {
    window.fetch = originalFetch;
  };
}

export function getAuthHeaders(tokenKey = 'admin_token') {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getLmsAuthHeaders() {
  return getAuthHeaders('lms_token');
}
