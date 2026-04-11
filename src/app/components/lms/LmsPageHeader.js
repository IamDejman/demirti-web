'use client';

import Link from 'next/link';

export default function LmsPageHeader({ title, subtitle, icon, breadcrumb, children }) {
  return (
    <div
      style={{
        paddingBottom: 'var(--lms-space-8)',
        borderBottom: '2px solid var(--primary-100)',
        marginBottom: 'var(--lms-space-6)',
      }}
    >
      {breadcrumb && (
        <Link
          href={breadcrumb.href}
          className="inline-flex items-center gap-1 mb-3 transition-colors hover:opacity-80"
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
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary-color)' }} aria-hidden>
              {icon}
            </div>
          )}
          <div className="min-w-0">
          <h1
            className="lms-page-header-title font-bold"
            style={{
              fontSize: 'var(--lms-title-xl, 2rem)',
              letterSpacing: '-0.03em',
              color: 'var(--neutral-900)',
              lineHeight: 'var(--lms-leading-tight, 1.2)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                marginTop: 'var(--lms-space-2)',
                fontSize: 'var(--lms-body)',
                color: 'var(--neutral-500)',
                lineHeight: 'var(--lms-leading-normal, 1.5)',
              }}
            >
              {subtitle}
            </p>
          )}
          </div>
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
