'use client';

import { useState, useEffect } from 'react';
import { getConsent, setConsent, isDoNotTrack } from '@/lib/consent';

export { getConsent, setConsent, hasConsent, isDoNotTrack } from '@/lib/consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (isDoNotTrack()) {
      setConsent('denied');
      return;
    }
    const consent = getConsent();
    if (consent === 'pending') {
      setVisible(true);
    }
    const onOpen = () => setShowPreferences(true);
    window.addEventListener('openTrackingPreferences', onOpen);
    return () => window.removeEventListener('openTrackingPreferences', onOpen);
  }, []);

  const handleGrant = () => {
    setConsent('granted');
    setVisible(false);
    setShowPreferences(false);
  };

  const handleDeny = () => {
    setConsent('denied');
    setVisible(false);
    setShowPreferences(false);
  };

  const closePreferences = () => setShowPreferences(false);

  if (!visible && !showPreferences) return null;

  const content = (
    <div
      className="consent-banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--background-color, #fff)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
        padding: '1rem 1.5rem',
        zIndex: 9999,
        borderTop: '1px solid var(--border-color, #e1e4e8)',
      }}
    >
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-color, #1a1a1a)', fontSize: '0.95rem' }}>
          We use analytics to improve your experience. No raw IP addresses or PII are stored. You can change your preference anytime.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleGrant}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary-color, #0066cc)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Allow
          </button>
          <button
            type="button"
            onClick={handleDeny}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: 'var(--text-light, #666)',
              border: '1px solid var(--border-color, #e1e4e8)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );

  if (showPreferences) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={closePreferences}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--background-color, #fff)',
            width: '100%',
            maxWidth: 500,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: '1.5rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Tracking preferences</h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Current: <strong>{getConsent()}</strong>. Choose whether to allow analytics.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleGrant}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Allow
            </button>
            <button
              type="button"
              onClick={handleDeny}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                color: 'var(--text-light)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={closePreferences}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                color: 'var(--text-light)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return content;
}
