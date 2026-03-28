'use client';

export default function LmsCard({ title, subtitle, icon, action, children, className = '', hoverable = true }) {
  return (
    <div className={`lms-card ${hoverable ? '' : 'lms-card-flat'} ${className}`}>
      {(title || action) && (
        <div className="lms-card-header">
          <div className="flex items-center" style={{ gap: 'var(--lms-space-3)' }}>
            {icon && (
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                  color: 'var(--primary-color)',
                  boxShadow: '0 2px 8px rgba(0, 82, 163, 0.12)',
                }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && <h2 className="font-semibold" style={{ fontSize: 'var(--lms-title-sm)', color: 'var(--neutral-900)', letterSpacing: 'var(--lms-tracking-normal)' }}>{title}</h2>}
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
