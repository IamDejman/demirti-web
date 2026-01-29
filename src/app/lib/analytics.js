'use client';

let cachedSessionId = null;

function getSessionId() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (cachedSessionId) {
    return cachedSessionId;
  }

  try {
    const existing = window.localStorage.getItem('cverse_session_id');
    if (existing) {
      cachedSessionId = existing;
      return cachedSessionId;
    }

    const newId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem('cverse_session_id', newId);
    cachedSessionId = newId;
    return cachedSessionId;
  } catch {
    // localStorage might be unavailable; fall back to in-memory ID
    if (!cachedSessionId) {
      cachedSessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
    return cachedSessionId;
  }
}

async function sendEvent(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Fire-and-forget; we don't care about the response in the UI
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently ignore analytics failures
  }
}

export async function trackPageView(extraProperties = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const sessionId = getSessionId();
  const url = window.location.href;
  const referrer = document.referrer || null;

  const properties = {
    ...extraProperties,
  };

  await sendEvent({
    type: 'pageview',
    name: null,
    sessionId,
    url,
    referrer,
    properties,
  });
}

export async function trackEvent(name, properties = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!name || typeof name !== 'string') {
    return;
  }

  const sessionId = getSessionId();
  const url = window.location.href;
  const referrer = document.referrer || null;

  const safeProperties = {
    ...properties,
  };

  await sendEvent({
    type: 'event',
    name,
    sessionId,
    url,
    referrer,
    properties: safeProperties,
  });
}

