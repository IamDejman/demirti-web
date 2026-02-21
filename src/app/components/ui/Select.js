'use client';

import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder,
    id,
    className = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || `select-${generatedId.replace(/:/g, '')}`;
  const hasError = Boolean(error);

  return (
    <>
      <div className={`ui-select-wrap ${hasError ? 'ui-select-wrap--error' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="ui-select-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`ui-select ${className}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <span id={`${selectId}-error`} className="ui-select-error" role="alert">
            {error}
          </span>
        )}
      </div>
      <style jsx>{`
        .ui-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .ui-select-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-color);
        }
        .ui-select {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 1rem;
          font-family: inherit;
          color: var(--text-color);
          background: var(--background-color);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .ui-select:hover:not(:disabled) {
          border-color: var(--neutral-300);
        }
        .ui-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 82, 163, 0.15);
        }
        .ui-select:disabled {
          background-color: var(--background-lighter);
          cursor: not-allowed;
          opacity: 0.7;
        }
        .ui-select-wrap--error .ui-select {
          border-color: var(--danger-color);
        }
        .ui-select-wrap--error .ui-select:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
        }
        .ui-select-error {
          font-size: 0.8125rem;
          color: var(--danger-color);
        }
      `}</style>
    </>
  );
});

export default Select;
