const CONSENT_KEY = 'cverse_consent';

export function getConsent() {
  if (typeof window === 'undefined') return 'pending';
  try {
    return localStorage.getItem(CONSENT_KEY) || 'pending';
  } catch {
    return 'pending';
  }
}

export function setConsent(value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

export function hasConsent() {
  return getConsent() === 'granted';
}

export function isDoNotTrack() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const dnt = navigator.doNotTrack || (typeof window !== 'undefined' && window.doNotTrack);
  return dnt === '1' || dnt === 'yes';
}
