'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLmsAuthHeaders } from '@/lib/authClient';

const STUDENT_NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/classroom', label: 'Classroom' },
  { href: '/dashboard/announcements', label: 'Announcements', badgeKey: 'unreadAnnouncements' },
  { href: '/dashboard/chat', label: 'Chat' },
  { href: '/dashboard/portfolio', label: 'Portfolio' },
];

const FACILITATOR_NAV = [
  { href: '/facilitator', label: 'Dashboard' },
  { href: '/facilitator/grading', label: 'Grading', badgeKey: 'pendingCount' },
  { href: '/facilitator/attendance', label: 'Attendance' },
  { href: '/facilitator/office-hours', label: 'Office Hours' },
  { href: '/facilitator/chat', label: 'Chat' },
];

export default function LmsTopNav({ variant = 'student', user, pendingCount = 0, topBarContent, unreadAnnouncements = 0 }) {
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
  const homeHref = variant === 'facilitator' ? '/facilitator' : '/dashboard';
  const profileHref = variant === 'facilitator' ? '/facilitator' : '/dashboard/profile';

  return (
    <>
      <header className="lms-topnav">
        <div className="lms-topnav-inner">
          {/* Left: Logo */}
          <Link href={homeHref} className="lms-topnav-brand">
            <Image src="/logo.png" alt={brandName} width={160} height={44} style={{ height: '36px', width: 'auto' }} priority />
            {variant === 'facilitator' && (
              <span className="lms-topnav-variant-badge">Facilitator</span>
            )}
          </Link>

          {/* Center: Nav links (desktop) */}
          <nav className="lms-topnav-links">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const badgeCounts = { pendingCount, unreadAnnouncements };
              const badge = item.badgeKey && badgeCounts[item.badgeKey] > 0 ? badgeCounts[item.badgeKey] : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`lms-topnav-link ${active ? 'active' : ''}`}
                >
                  {item.label}
                  {badge != null && (
                    <span className="lms-topnav-badge">{badge > 99 ? '99+' : badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Avatar, Notifications, Logout */}
          <div className="lms-topnav-actions">
            {user && (
              <Link href={profileHref} className="lms-topnav-avatar" title={user.firstName || user.email}>
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = (user.firstName || user.email || 'U').charAt(0).toUpperCase();
                    }}
                  />
                ) : (
                  (user.firstName || user.email || 'U').charAt(0).toUpperCase()
                )}
              </Link>
            )}
            {topBarContent}
            <button
              type="button"
              onClick={handleLogout}
              className="lms-topnav-logout"
              aria-label="Logout"
              title="Logout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lms-topnav-hamburger"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav className="lms-topnav-mobile">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const badgeCounts = { pendingCount, unreadAnnouncements };
              const badge = item.badgeKey && badgeCounts[item.badgeKey] > 0 ? badgeCounts[item.badgeKey] : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`lms-topnav-mobile-link ${active ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                  {badge != null && (
                    <span className="lms-topnav-badge">{badge > 99 ? '99+' : badge}</span>
                  )}
                </Link>
              );
            })}
            <div className="lms-topnav-mobile-footer">
              {user && (
                <Link
                  href={profileHref}
                  className="lms-topnav-mobile-user"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="lms-topnav-avatar lms-topnav-avatar-sm">
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = (user.firstName || user.email || 'U').charAt(0).toUpperCase();
                        }}
                      />
                    ) : (
                      (user.firstName || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium">{user.firstName || user.email}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="lms-topnav-mobile-link"
                style={{ color: '#b91c1c' }}
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          style={{ top: '64px' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
