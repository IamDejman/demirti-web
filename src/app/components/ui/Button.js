'use client';

import { forwardRef } from 'react';

const SPINNER = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: 'spin 0.8s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    children,
    className = '',
    type = 'button',
    ..._rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <>
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`}
        aria-busy={loading}
        aria-disabled={isDisabled}
      >
        {loading && <span className="ui-btn__spinner" aria-hidden="true">{SPINNER}</span>}
        {!loading && icon && <span className="ui-btn__icon">{icon}</span>}
        {children && <span className="ui-btn__text">{children}</span>}
      </button>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .ui-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: inherit;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition, all 0.2s ease);
          border: none;
          min-height: 44px;
        }
        .ui-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ui-btn:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .ui-btn--sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          min-height: 36px;
        }
        .ui-btn--md {
          padding: 0.5rem 1rem;
          font-size: 0.9375rem;
        }
        .ui-btn--lg {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          min-height: 48px;
        }
        .ui-btn--primary {
          background: var(--primary-color);
          color: #fff;
        }
        .ui-btn--primary:hover:not(:disabled) {
          background: var(--primary-dark);
        }
        .ui-btn--secondary {
          background: var(--background-light);
          color: var(--text-color);
          border: 1px solid var(--border-color);
        }
        .ui-btn--secondary:hover:not(:disabled) {
          background: var(--background-lighter);
          border-color: var(--neutral-300);
        }
        .ui-btn--ghost {
          background: transparent;
          color: var(--text-color);
        }
        .ui-btn--ghost:hover:not(:disabled) {
          background: var(--background-light);
        }
        .ui-btn--danger {
          background: var(--danger-color);
          color: #fff;
        }
        .ui-btn--danger:hover:not(:disabled) {
          filter: brightness(0.95);
        }
        .ui-btn__spinner,
        .ui-btn__icon {
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </>
  );
});

export default Button;
