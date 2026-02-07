'use client';

export default function AdminFormField({ label, id, hint, children, className = '' }) {
  return (
    <div className={`admin-form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="admin-form-label">
          {label}
        </label>
      )}
      <div className="admin-form-field">
        {children}
      </div>
      {hint && (
        <p className="admin-form-hint">{hint}</p>
      )}
    </div>
  );
}
