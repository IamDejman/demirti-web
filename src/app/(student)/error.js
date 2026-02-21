'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function StudentError({ error, reset }) {
  useEffect(() => {
    console.error('Student dashboard error:', error);
  }, [error]);

  return (
    <div className="lms-main-content" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div
          className="lms-card-icon-box"
          style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem', fontSize: '1.5rem' }}
        >
          ⚠
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 'var(--lms-body-sm)', color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          We ran into an issue loading this page. You can try again or go back to your dashboard.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={reset} className="lms-btn lms-btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="lms-btn lms-btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
