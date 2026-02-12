'use client';

export default function LmsCard({ title, subtitle, icon, action, children, className = '', hoverable = true, accent }) {
  const accentClass = accent ? `lms-card-accent-${accent}` : '';

  return (
    <div
      className={`lms-card rounded-xl ${accentClass} ${
        hoverable ? '' : 'hover:transform-none hover:shadow-sm'
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between" style={{ gap: 'var(--lms-space-4)', padding: 'var(--lms-space-6) var(--lms-space-6) 0' }}>
          <div className="flex items-center" style={{ gap: 'var(--lms-space-3)' }}>
            {icon && (
              <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.1), rgba(0, 166, 126, 0.08))',
                  color: 'var(--primary-color)',
                }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && <h2 className="font-semibold" style={{ fontSize: 'var(--lms-title-sm)', color: 'var(--neutral-900)' }}>{title}</h2>}
              {subtitle && <p className="mt-0.5" style={{ fontSize: 'var(--lms-body-sm)', color: 'var(--neutral-500)' }}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div style={{ padding: 'var(--lms-space-6)' }}>{children}</div>
    </div>
  );
}
