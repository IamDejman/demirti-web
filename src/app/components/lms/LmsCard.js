'use client';

export default function LmsCard({ title, subtitle, action, children, className = '', hoverable = true }) {
  return (
    <div
      className={`lms-card bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-gray-200' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={title || action ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
}
