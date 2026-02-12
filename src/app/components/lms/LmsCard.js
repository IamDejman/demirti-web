'use client';

export default function LmsCard({ title, subtitle, icon, action, children, className = '', hoverable = true }) {
  return (
    <div
      className={`lms-card rounded-xl transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-gray-200' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between" style={{ gap: 'var(--lms-space-4)', padding: 'var(--lms-space-6) var(--lms-space-6) 0' }}>
          <div className="flex items-center" style={{ gap: 'var(--lms-space-2)' }}>
            {icon && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 82, 163, 0.1)', color: 'var(--primary-color)' }}>
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
      <div className="p-6" style={{ padding: 'var(--lms-space-6)' }}>{children}</div>
    </div>
  );
}
