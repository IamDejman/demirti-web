'use client';

import Link from 'next/link';

export default function LmsPageHeader({ title, subtitle, icon, breadcrumb, children }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
      {breadcrumb && (
        <Link
          href={breadcrumb.href}
          className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-3 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10H5M5 10l5-5M5 10l5 5" />
          </svg>
          {breadcrumb.label}
        </Link>
      )}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2.5 bg-white/15 rounded-lg">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-white/90">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
