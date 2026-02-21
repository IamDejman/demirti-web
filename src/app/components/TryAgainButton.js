'use client';

export default function TryAgainButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        marginTop: '1.5rem',
        padding: '0.625rem 1.25rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'var(--primary-color)',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Try again
    </button>
  );
}
