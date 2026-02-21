'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="admin-content-area" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div
          className="admin-card"
          style={{ padding: '2rem', borderColor: '#fecaca' }}
        >
          <h2 className="admin-page-title" style={{ marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p className="admin-page-description" style={{ marginBottom: '1.5rem' }}>
            An error occurred while loading this page. Try again or return to the admin home.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={reset} className="admin-btn admin-btn-primary">
              Try again
            </button>
            <Link href="/admin" className="admin-btn admin-btn-secondary">
              Admin Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
