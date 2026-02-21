'use client';

import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  { label, error, helperText, id, className = '', ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId.replace(/:/g, '')}`;
  const hasError = Boolean(error);

  return (
    <>
      <div className={`ui-input-wrap ${hasError ? 'ui-input-wrap--error' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${className}`}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...rest}
        />
        {hasError && (
          <span id={`${inputId}-error`} className="ui-input-error" role="alert">
            {error}
          </span>
        )}
        {!hasError && helperText && (
          <span id={`${inputId}-helper`} className="ui-input-helper">
            {helperText}
          </span>
        )}
      </div>
      <style jsx>{`
        .ui-input-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .ui-input-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-color);
        }
        .ui-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          font-family: inherit;
          color: var(--text-color);
          background: var(--background-color);
          border: 2px solid var(--neutral-300);
          border-radius: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .ui-input::placeholder {
          color: var(--text-lighter);
        }
        .ui-input:hover:not(:disabled) {
          border-color: var(--neutral-400);
        }
        .ui-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 22%, transparent);
        }
        .ui-input:disabled {
          background: var(--background-lighter);
          cursor: not-allowed;
          opacity: 0.7;
        }
        .ui-input-wrap--error .ui-input {
          border-color: var(--danger-color);
        }
        .ui-input-wrap--error .ui-input:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
        }
        .ui-input-error {
          font-size: 0.8125rem;
          color: var(--danger-color);
        }
        .ui-input-helper {
          font-size: 0.8125rem;
          color: var(--text-light);
        }
      `}</style>
    </>
  );
});

export default Input;
