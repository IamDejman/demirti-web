'use client';

export default function CookiePreferencesLink() {
  return (
    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('openTrackingPreferences'))}
        style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Cookie / tracking preferences
      </button>
    </p>
  );
}
