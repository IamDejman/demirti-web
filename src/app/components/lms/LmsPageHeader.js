'use client';

import Link from 'next/link';

export default function LmsPageHeader({ title, subtitle, icon, breadcrumb, children }) {
  return (
    <div
      style={{
        paddingBottom: 'var(--lms-space-6)',
        borderBottom: '1px solid var(--neutral-100)',
        marginBottom: 'var(--lms-space-6)',
      }}
    >
      {breadcrumb && (
        <Link
          href={breadcrumb.href}
          className="inline-flex items-center gap-1 mb-2 transition-colors"
          style={{
            fontSize: 'var(--lms-body-sm)',
            color: 'var(--neutral-400)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10H5M5 10l5-5M5 10l5 5" />
          </svg>
          {breadcrumb.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-bold"
            style={{
              fontSize: 'var(--lms-title-lg, 1.75rem)',
              letterSpacing: '-0.02em',
              color: 'var(--neutral-900)',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                marginTop: 'var(--lms-space-1)',
                fontSize: 'var(--lms-body)',
                color: 'var(--neutral-500)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
