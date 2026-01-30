'use client';

import { getConsent, isDoNotTrack } from '@/lib/consent';

const SESSION_KEY = 'cverse_session_id';
const VISITOR_KEY = 'cverse_visitor_id';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SCROLL_DEBOUND_MS = 150;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function uuid() {
  return 'v_' + ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.random() * 16) >> (c / 4)).toString(16)
  );
}

function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) out[key] = val;
  }
  return out;
}

function getVisitorId() {
  if (typeof window === 'undefined') return null;
  if (getConsent() !== 'granted' || isDoNotTrack()) return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function getSessionId() {
  if (typeof window === 'undefined') return null;
  if (getConsent() !== 'granted' || isDoNotTrack()) return null;
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    const storedAt = localStorage.getItem(SESSION_KEY + '_at');
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

function getScreenResolution() {
  if (typeof window === 'undefined' || !window.screen) return null;
  return `${window.screen.width}x${window.screen.height}`;
}

function getViewportSize() {
  if (typeof window === 'undefined') return null;
  return `${window.innerWidth}x${window.innerHeight}`;
}

function getLanguage() {
  if (typeof navigator === 'undefined') return null;
  return navigator.language || null;
}

function getPayloadBase() {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return null;
  const utm = getUtmParams();
  return {
    visitorId,
    sessionId,
    url: window.location.href || '',
    referrer: document.referrer || '',
    utmSource: utm.utm_source || null,
    utmMedium: utm.utm_medium || null,
    utmCampaign: utm.utm_campaign || null,
    utmContent: utm.utm_content || null,
    utmTerm: utm.utm_term || null,
    screenResolution: getScreenResolution(),
    viewportSize: getViewportSize(),
    language: getLanguage(),
    timestamp: new Date().toISOString(),
  };
}

function sendEvent(payload) {
  if (!payload) return;
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function sendBeaconEvent(payload) {
  if (!payload) return;
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', blob);
  } else {
    sendEvent(payload);
  }
}

let scrollDepthMax = 0;
let scrollDepthReported = {};
let pageEntryTime = null;
let scrollDebounceTimer = null;

function getScrollDepthPercent() {
  if (typeof document === 'undefined' || !document.documentElement) return 0;
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const clientHeight = doc.clientHeight;
  const scrollHeight = doc.scrollHeight;
  if (scrollHeight <= clientHeight) return 100;
  const pct = Math.min(100, Math.round(((scrollTop + clientHeight) / scrollHeight) * 100));
  return pct;
}

function updateScrollDepth() {
  const pct = getScrollDepthPercent();
  if (pct > scrollDepthMax) scrollDepthMax = pct;
  for (const milestone of [25, 50, 75, 100]) {
    if (scrollDepthMax >= milestone && !scrollDepthReported[milestone]) {
      scrollDepthReported[milestone] = true;
      const base = getPayloadBase();
      if (base) {
        sendEvent({
          ...base,
          type: 'event',
          name: 'scroll_depth',
          properties: { depth: milestone },
        });
      }
    }
  }
}

function setupScrollTracking() {
  if (typeof window === 'undefined') return;
  const onScroll = () => {
    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(updateScrollDepth, SCROLL_DEBOUND_MS);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  updateScrollDepth();
}

function sendPageExit() {
  const base = getPayloadBase();
  if (!base) return;
  const durationSeconds = pageEntryTime ? Math.round((Date.now() - pageEntryTime) / 1000) : 0;
  const payload = {
    ...base,
    type: 'page_exit',
    name: 'page_exit',
    pageDurationSeconds: durationSeconds,
    scrollDepthPercent: scrollDepthMax,
    timestamp: new Date().toISOString(),
  };
  sendBeaconEvent(payload);
}

function setupPageExitTracking() {
  if (typeof window === 'undefined') return;
  const handleExit = () => sendPageExit();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleExit();
  });
  window.addEventListener('pagehide', handleExit);
  window.addEventListener('beforeunload', handleExit);
}

export function trackPageView() {
  if (typeof window === 'undefined') return;
  if (getConsent() !== 'granted' || isDoNotTrack()) return;
  scrollDepthMax = 0;
  scrollDepthReported = {};
  pageEntryTime = Date.now();

  const base = getPayloadBase();
  if (!base) return;
  sendEvent({
    ...base,
    type: 'pageview',
    timestamp: new Date().toISOString(),
  });

  setupScrollTracking();
  setupPageExitTracking();
}

export function trackEvent(name, properties = {}) {
  if (typeof window === 'undefined') return;
  if (getConsent() !== 'granted' || isDoNotTrack()) return;
  const base = getPayloadBase();
  if (!base) return;
  sendEvent({
    ...base,
    type: 'event',
    name,
    properties: typeof properties === 'object' && properties !== null ? properties : {},
    timestamp: new Date().toISOString(),
  });
}
