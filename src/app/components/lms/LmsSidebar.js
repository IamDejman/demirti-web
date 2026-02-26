'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const ICONS = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  week: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  assignments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h6M9 18h6M9 12h6" />
    </svg>
  ),
  officeHours: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  portfolio: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6M9 18h6" />
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="9" x2="9" y2="15" />
      <line x1="15" y1="9" x2="15" y2="15" />
    </svg>
  ),
  grading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6M9 18h6M9 12h6" />
    </svg>
  ),
  attendance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  megaphone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4l-6 3H5a1 1 0 00-1 1v2a1 1 0 001 1h5l6 3V4z" />
      <path d="M16 4a3 3 0 010 10" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h8v5a4 4 0 01-8 0V3zM3 3h3M14 3h3M3 3v3a3 3 0 003 3M17 3v3a3 3 0 01-3 3M8 14h4M10 12v5M7 17h6" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13 21a1 1 0 0 1-2 0" />
    </svg>
  ),
  chevronLeft: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  graduation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
};

const STUDENT_NAV = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/dashboard/classroom', label: 'Classroom', icon: 'graduation' },
  { href: '/dashboard/announcements', label: 'Announcements', icon: 'megaphone' },
  { href: '/dashboard/communities', label: 'Communities', icon: 'users' },
  { href: '/dashboard/chat', label: 'Chat', icon: 'chat' },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: 'briefcase' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'profile' },
];

const FACILITATOR_NAV = [
  { href: '/facilitator', label: 'Dashboard', icon: 'dashboard' },
  { href: '/facilitator/grading', label: 'Grading', icon: 'grading', badgeKey: 'pendingCount' },
  { href: '/facilitator/attendance', label: 'Attendance', icon: 'attendance' },
  { href: '/facilitator/office-hours', label: 'Office Hours', icon: 'officeHours' },
  { href: '/facilitator/chat', label: 'Chat', icon: 'chat' },
];

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function LmsSidebar({ variant = 'student', collapsed = false, onToggleCollapse, user, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = variant === 'facilitator' ? FACILITATOR_NAV : STUDENT_NAV;

  const isActive = (href) => {
    if (href === '/dashboard' || href === '/facilitator') return pathname === href;
    if (href === '/dashboard/classroom') {
      return pathname === '/dashboard/classroom'
        || pathname.startsWith('/dashboard/classroom/')
        || pathname === '/dashboard/weeks'
        || pathname.startsWith('/dashboard/week/')
        || pathname === '/dashboard/assignments'
        || pathname.startsWith('/dashboard/assignments/')
        || pathname === '/dashboard/office-hours'
        || pathname === '/dashboard/ai-assistant';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: getLmsAuthHeaders() });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_authenticated');
      localStorage.removeItem('lms_token');
    }
    router.push('/login');
  };

  const brandName = variant === 'facilitator' ? 'CVERSE Facilitator' : 'CVERSE Academy';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lms-sidebar-overlay fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`lms-sidebar glass-sidebar fixed left-0 top-0 z-50 h-full flex flex-col transition-all duration-200 ${
          collapsed ? 'lms-sidebar-collapsed w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="lms-sidebar-header flex items-center justify-between flex-shrink-0">
          {!collapsed && (
            <Link href={variant === 'facilitator' ? '/facilitator' : '/dashboard'} className="flex items-center gap-2 truncate">
              <Image src="/logo.png" alt={brandName} width={160} height={44} style={{ height: '36px', width: 'auto' }} priority />
              {variant === 'facilitator' && (
                <span className="lms-sidebar-badge">Facilitator</span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hidden lg:flex min-h-[44px] min-w-[44px] items-center justify-center"
            style={{ color: 'var(--neutral-500)' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? ICONS.chevronRight : ICONS.chevronLeft}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'var(--neutral-500)' }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const badge = item.badgeKey === 'pendingCount' && pendingCount > 0 ? pendingCount : null;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`lms-sidebar-link flex items-center gap-3 ${active ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex-shrink-0 text-current">{ICONS[item.icon]}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge != null && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center text-xs font-semibold rounded-full text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="lms-sidebar-user flex-shrink-0">
          {user && !collapsed && (
            <Link
              href={variant === 'facilitator' ? '/facilitator' : '/dashboard/profile'}
              className="flex items-center gap-3 mb-3 rounded-lg py-1 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'rgba(0, 82, 163, 0.1)', color: 'var(--primary-color)' }}>
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={`${user.firstName || 'User'} profile photo`} className="w-full h-full object-cover" />
                ) : (
                  (user.firstName || user.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--neutral-900)' }}>{user.firstName || user.email}</p>
                <p className="text-xs truncate" style={{ color: 'var(--neutral-500)' }}>{user.email}</p>
              </div>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-2 rounded-lg text-sm min-h-[44px] transition-colors hover:opacity-90"
            style={{ color: 'var(--lms-logout-color, #b91c1c)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden fixed z-30 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${mobileOpen ? 'hidden' : ''}`}
        style={{ top: 'max(var(--lms-space-4), env(safe-area-inset-top, 0px))', left: 'max(var(--lms-space-4), env(safe-area-inset-left, 0px))', backgroundColor: 'var(--background-color)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)', color: 'var(--neutral-600)' }}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </>
  );
}
