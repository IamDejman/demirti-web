/**
 * Client-side auth helpers.
 * Tokens are stored in httpOnly cookies (set by the server on login).
 * These helpers manage UI-only auth flags and provide empty header stubs
 * so existing call sites continue to work (cookies are sent automatically).
 */

const SESSION_TIMED_OUT_MESSAGE = 'Session timed out';

export function handleAdmin401() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('admin_authenticated');
  } catch {
    // ignore
  }
  const returnTo = window.location.pathname + window.location.search;
  const params = new URLSearchParams({ message: SESSION_TIMED_OUT_MESSAGE });
  if (returnTo && returnTo !== '/admin/login') {
    params.set('returnTo', returnTo);
  }
  window.location.href = `/admin/login?${params.toString()}`;
}

export function handleLms401() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('lms_authenticated');
  } catch {
    // ignore
  }
  const returnTo = window.location.pathname + window.location.search;
  const params = new URLSearchParams({ message: SESSION_TIMED_OUT_MESSAGE });
  if (returnTo && returnTo !== '/' && returnTo !== '/login') {
    params.set('returnTo', returnTo);
  }
  window.location.href = `/login?${params.toString()}`;
}

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

export function installAdmin401Interceptor() {
  if (typeof window === 'undefined') return () => {};
  const originalFetch = window.fetch;
  window.fetch = function fetchWith401Handler(input, _init) {
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

export function installLms401Interceptor() {
  if (typeof window === 'undefined') return () => {};
  const originalFetch = window.fetch;
  window.fetch = function fetchWithLms401(input, _init) {
    const url = typeof input === 'string' ? input : input?.url;
    return originalFetch.apply(this, arguments).then((response) => {
      if (response.status === 401 && isAppApiRequest(url)) {
        handleLms401();
      }
      return response;
    });
  };
  return () => {
    window.fetch = originalFetch;
  };
}

/**
 * Returns empty headers. Auth tokens are now in httpOnly cookies (sent automatically).
 * Kept as a function for backward compatibility with existing call sites.
 */
export function getAuthHeaders() {
  return {};
}

export function getLmsAuthHeaders() {
  return {};
}
