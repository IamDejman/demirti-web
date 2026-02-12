'use client';

import Link from 'next/link';

export default function LmsPageHeader({ title, subtitle, icon, breadcrumb, children }) {
  return (
    <div
      className="rounded-xl text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #0066cc 50%, #00a67e 100%)',
        padding: 'var(--lms-space-8) var(--lms-space-6)',
      }}
    >
      {/* Decorative overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10">
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
            <div
              className="flex-shrink-0 rounded-lg flex items-center justify-center"
              style={{
                padding: '0.625rem',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h1 className="font-bold" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>{title}</h1>
            {subtitle && <p className="mt-1" style={{ marginTop: 'var(--lms-space-1)', opacity: 0.9 }}>{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
