'use client';

export default function LmsEmptyState({ icon, title, description, action }) {
  return (
    <div
      className="lms-empty-state flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--lms-space-16, 4rem) var(--lms-space-6)' }}
    >
      {icon && (
        <div
          className="mb-5 flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
            color: 'var(--primary-color)',
            border: '2px dashed var(--primary-200)',
            boxShadow: '0 4px 12px rgba(0, 82, 163, 0.1)',
          }}
        >
          <div className="lms-empty-state-icon" style={{ color: 'inherit' }}>
            {icon}
          </div>
        </div>
      )}
      <p className="font-semibold" style={{ fontSize: 'var(--lms-title-sm)', color: 'var(--neutral-800)' }}>{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm" style={{ fontSize: 'var(--lms-body-sm)', color: 'var(--neutral-500)', opacity: 0.85 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 'var(--lms-space-5)' }}>{action}</div>}
    </div>
  );
}
