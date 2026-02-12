'use client';

export default function LmsEmptyState({ icon, title, description, action }) {
  return (
    <div
      className="lms-empty-state flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--lms-space-10) var(--lms-space-6)' }}
    >
      {icon && (
        <div className="lms-empty-state-icon mb-4" style={{ color: 'var(--neutral-300)' }}>
          {icon}
        </div>
      )}
      <p className="font-medium" style={{ fontSize: 'var(--lms-body)', color: 'var(--neutral-700)' }}>{title}</p>
      {description && (
        <p className="mt-1 max-w-sm" style={{ marginTop: 'var(--lms-space-1)', fontSize: 'var(--lms-body-sm)', color: 'var(--neutral-500)' }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 'var(--lms-space-4)' }}>{action}</div>}
    </div>
  );
}
