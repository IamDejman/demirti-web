'use client';

import Link from 'next/link';

export default function LmsPageHeader({ title, subtitle, icon, breadcrumb, children }) {
  return (
    <div
      className="rounded-xl text-white"
      style={{
        background: 'linear-gradient(to bottom right, var(--primary-color), var(--primary-dark))',
        padding: 'var(--lms-space-6)',
      }}
    >
      {breadcrumb && (
        <Link
          href={breadcrumb.href}
          className="inline-flex items-center gap-1 mb-3 transition-colors hover:opacity-100"
          style={{ fontSize: 'var(--lms-body-sm)', opacity: 0.85 }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10H5M5 10l5-5M5 10l5 5" />
          </svg>
          {breadcrumb.label}
        </Link>
      )}
      <div className="flex items-center gap-3" style={{ gap: 'var(--lms-space-3)' }}>
        {icon && (
          <div className="flex-shrink-0 p-2.5 rounded-lg bg-white/15">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-bold" style={{ fontSize: 'var(--lms-title)' }}>{title}</h1>
          {subtitle && <p className="mt-1 opacity-90" style={{ marginTop: 'var(--lms-space-1)' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
