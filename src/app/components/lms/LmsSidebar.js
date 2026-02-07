'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const ICONS = {
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
};

const STUDENT_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/assignments', label: 'Assignments', icon: 'assignments' },
  { href: '/dashboard/office-hours', label: 'Office Hours', icon: 'officeHours' },
  { href: '/dashboard/chat', label: 'Chat', icon: 'chat' },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: 'portfolio' },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: 'ai' },
];

const FACILITATOR_NAV = [
  { href: '/facilitator', label: 'Dashboard', icon: 'dashboard' },
  { href: '/facilitator/grading', label: 'Grading', icon: 'grading', badgeKey: 'pendingCount' },
  { href: '/facilitator/attendance', label: 'Attendance', icon: 'attendance' },
  { href: '/facilitator/office-hours', label: 'Office Hours', icon: 'officeHours' },
  { href: '/facilitator/chat', label: 'Chat', icon: 'chat' },
];

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function LmsSidebar({ variant = 'student', collapsed = false, onToggleCollapse, user, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = variant === 'facilitator' ? FACILITATOR_NAV : STUDENT_NAV;

  const isActive = (href) => {
    if (href === '/dashboard' || href === '/facilitator') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    if (typeof window !== 'undefined') localStorage.removeItem('lms_token');
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
        className={`lms-sidebar fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
          collapsed ? 'lms-sidebar-collapsed w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="lms-sidebar-header flex items-center justify-between h-14 px-4 border-b border-gray-100 flex-shrink-0">
          {!collapsed && (
            <Link href={variant === 'facilitator' ? '/facilitator' : '/dashboard'} className="text-lg font-bold text-primary truncate">
              {brandName}
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 hidden lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? ICONS.chevronRight : ICONS.chevronLeft}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
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
                    className={`lms-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex-shrink-0 text-current">{ICONS[item.icon]}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge != null && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-primary text-white">
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
        <div className="lms-sidebar-user border-t border-gray-100 p-4 flex-shrink-0">
          {user && !collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.firstName || user.email}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        className={`lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 ${mobileOpen ? 'hidden' : ''}`}
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
