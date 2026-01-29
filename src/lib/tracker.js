'use client';

const SESSION_KEY = 'cverse_session_id';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    let storedAt = localStorage.getItem(SESSION_KEY + '_at');
    const now = Date.now();
    if (!sessionId || !storedAt || now - Number(storedAt) > SESSION_TTL_MS) {
      sessionId = 's_' + Math.random().toString(36).slice(2) + '_' + now.toString(36);
      localStorage.setItem(SESSION_KEY, sessionId);
      localStorage.setItem(SESSION_KEY + '_at', String(now));
    }
    return sessionId;
  } catch {
    return null;
  }
}

export function trackPageView() {
  if (typeof window === 'undefined') return;
  const url = window.location.href || '';
  const referrer = document.referrer || '';
  const sessionId = getSessionId();
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'pageview',
      sessionId,
      url,
      referrer,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

export function trackEvent(name, properties = {}) {
  if (typeof window === 'undefined') return;
  const url = window.location.href || '';
  const referrer = document.referrer || '';
  const sessionId = getSessionId();
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'event',
      name,
      sessionId,
      url,
      referrer,
      properties: typeof properties === 'object' && properties !== null ? properties : {},
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}
