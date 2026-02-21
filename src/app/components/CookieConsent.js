'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: 'var(--background-color)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <p style={{ margin: 0, color: 'var(--text-color)', fontSize: '0.9375rem', flex: '1 1 300px' }}>
        We use cookies to enhance your experience. By continuing to use this site, you agree to our use of cookies.{' '}
        <Link href="/privacy" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
          Privacy Policy
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={decline}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: 'var(--text-light)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
