'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--background-light, #f8fafc)',
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          background: 'var(--background-color, #fff)',
          borderRadius: 20,
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
          padding: '2.5rem 2rem',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">
          ⚠
        </div>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-color, #0f172a)',
            marginBottom: '0.5rem',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-light, #475569)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--primary-color, #0052a3)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            minHeight: 44,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
