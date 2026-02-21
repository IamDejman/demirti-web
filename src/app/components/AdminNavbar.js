'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

const navLinkStyle = (active) => ({
  textDecoration: 'none',
  color: active ? 'var(--primary-color)' : 'var(--text-color)',
  fontWeight: active ? '600' : '400',
  fontSize: '1rem',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  backgroundColor: active ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
  transition: 'all 0.3s ease',
});

const NAV_GROUPS = [
  { id: 'home', label: 'Home', href: '/admin', items: null },
  { id: 'applications', label: 'Applications', href: null, items: [
    { href: '/admin/scholarships', label: 'Scholarships' },
    { href: '/admin/sponsored-applications', label: 'Sponsored' },
    { href: '/admin/discounts', label: 'Discounts' },
  ]},
  { id: 'analytics', label: 'Analytics', href: null, items: [
    { href: '/admin/analytics', label: 'Overview' },
    { href: '/admin/goals', label: 'Goals' },
    { href: '/admin/funnels', label: 'Funnels' },
    { href: '/admin/audit-logs', label: 'Audit Logs' },
    { href: '/admin/exports', label: 'Exports' },
  ]},
  { id: 'lms', label: 'LMS', href: null, items: [
    { href: '/admin/cohorts', label: 'Cohorts' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/certificates', label: 'Certificates' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/course-templates', label: 'Course Templates' },
  ]},
  { id: 'more', label: 'More', href: null, items: [
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/professionals', label: 'Professionals' },
    { href: '/admin/sample-projects', label: 'Projects' },
    { href: '/admin/config', label: 'Config' },
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/impersonation', label: 'Impersonate' },
    { href: '/admin/notification-templates', label: 'Notif Templates' },
    { href: '/admin/ai-settings', label: 'AI Settings' },
    { href: '/admin/ai-usage', label: 'AI Usage' },
  ]},
];

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isActive = (path) => pathname === path || (path !== '/admin' && pathname.startsWith(path));
  const isGroupActive = (group) => {
    if (group.href) return isActive(group.href);
    return group.items?.some((i) => isActive(i.href));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // proceed with client-side cleanup
    }
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="admin-nav">
        <div className="admin-nav-inner">
          <Link href="/admin" className="admin-nav-logo" onClick={closeMenu}>
            <Image src="/logo.png" alt="CVERSE Admin" width={120} height={40} className="admin-nav-logo-img" style={{ width: 'auto', height: 'auto' }} priority />
          </Link>

          <div className="admin-nav-desktop" ref={navRef}>
            {NAV_GROUPS.map((group) => (
              group.items ? (
                <div key={group.id} className="admin-nav-dropdown-wrap">
                  <button
                    type="button"
                    className={`admin-nav-more-btn ${openDropdown === group.id || isGroupActive(group) ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
                    aria-expanded={openDropdown === group.id}
                    aria-haspopup="true"
                  >
                    {group.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginLeft: '4px', transform: openDropdown === group.id ? 'rotate(180deg)' : 'none' }}>
                      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openDropdown === group.id && (
                    <div className="admin-nav-dropdown">
                      {group.items.map(({ href, label }) => (
                        <Link key={href} href={href} onClick={() => setOpenDropdown(null)} className={isActive(href) ? 'active' : ''}>
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={group.id} href={group.href} style={navLinkStyle(isActive(group.href))}>{group.label}</Link>
              )
            ))}
            <ThemeToggle compact />
            <button
              type="button"
              onClick={handleLogout}
              className="admin-nav-logout-btn"
              aria-label="Logout"
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="admin-nav-hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`admin-nav-mobile ${isMenuOpen ? 'open' : ''}`}>
          {NAV_GROUPS.map((group) => (
            group.items ? (
              <div key={group.id} className="admin-nav-mobile-group">
                <span className="admin-nav-mobile-group-label">{group.label}</span>
                {group.items.map(({ href, label }) => (
                  <Link key={href} href={href} onClick={closeMenu} style={navLinkStyle(isActive(href))}>{label}</Link>
                ))}
              </div>
            ) : (
              <Link key={group.id} href={group.href} onClick={closeMenu} style={navLinkStyle(isActive(group.href))}>{group.label}</Link>
            )
          ))}
          <button type="button" onClick={handleLogout} className="admin-nav-mobile-logout" aria-label="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <style jsx>{`
        .admin-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: var(--background-color);
          color: var(--text-color);
          padding: 1rem 2rem;
          z-index: 1000;
          box-shadow: var(--shadow-sm);
          border-bottom: 1px solid var(--border-color);
          min-height: 70px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .admin-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;
          min-width: 0;
        }
        .admin-nav-logo {
          text-decoration: none;
          display: flex;
          align-items: center;
          flex-shrink: 1;
          min-width: 0;
        }
        .admin-nav-logo-img {
          width: 120px;
          height: auto;
          flex-shrink: 0;
        }
        .admin-nav-title {
          margin-left: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
        }
        .admin-nav-title-short {
          display: none;
        }
        .admin-nav-desktop {
          display: flex;
          gap: 1.25rem;
          align-items: center;
          margin-left: auto;
        }
        .admin-nav-dropdown-wrap,
        .admin-nav-more {
          position: relative;
        }
        .admin-nav-more-btn {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-color);
          font-size: 1rem;
          font-weight: 400;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .admin-nav-more-btn:hover,
        .admin-nav-more-btn.active {
          color: var(--primary-color);
          font-weight: 600;
          background: rgba(0, 102, 204, 0.1);
        }
        .admin-nav-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          min-width: 220px;
          background: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          padding: 0.5rem 0;
          z-index: 1001;
          max-height: 70vh;
          overflow-y: auto;
        }
        .admin-nav-dropdown-group {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .admin-nav-dropdown-group:last-child {
          border-bottom: none;
        }
        .admin-nav-dropdown-label {
          display: block;
          padding: 0.25rem 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
        }
        .admin-nav-dropdown a,
        .admin-nav-dropdown-group a {
          display: block;
          padding: 0.4rem 1rem;
          font-size: 0.9rem;
          color: var(--text-color);
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .admin-nav-dropdown a:hover,
        .admin-nav-dropdown a.active,
        .admin-nav-dropdown-group a:hover,
        .admin-nav-dropdown-group a.active {
          background: rgba(0, 102, 204, 0.08);
          color: var(--primary-color);
        }
        .admin-nav-logout-btn {
          padding: 0.5rem;
          background: transparent;
          color: #dc3545;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }
        .admin-nav-logout-btn:hover {
          color: #c82333;
          background: rgba(220, 53, 69, 0.1);
        }
        .admin-nav-hamburger {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-color);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          line-height: 1;
          margin-left: auto;
        }
        .admin-nav-mobile {
          display: none;
          flex-direction: column;
          gap: 0;
          padding: 1rem 0 0;
          border-top: 1px solid var(--border-color);
          margin-top: 0.5rem;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          box-sizing: border-box;
        }
        .admin-nav-mobile a {
          min-height: 44px;
          display: flex;
          align-items: center;
          padding: 0.75rem 0;
          box-sizing: border-box;
        }
        .admin-nav-mobile-group {
          padding: 0.5rem 0;
          border-top: 1px solid #f0f0f0;
        }
        .admin-nav-mobile-group-label {
          display: block;
          padding: 0.5rem 0 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
        }
        @media (min-width: 769px) {
          .admin-nav-mobile,
          .admin-nav-mobile.open {
            display: none !important;
          }
        }
        .admin-nav-mobile.open {
          display: flex;
        }
        .admin-nav-mobile-logout {
          padding: 0.75rem 1rem;
          background: transparent;
          color: #dc3545;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .admin-nav-mobile-logout:hover {
          background: rgba(220, 53, 69, 0.08);
        }
        .admin-nav-mobile-logout {
          min-height: 44px;
        }

        @media (max-width: 768px) {
          .admin-nav {
            padding: 0.75rem 1rem;
            min-height: 56px;
          }
          .admin-nav-logo-img {
            width: 90px;
          }
          .admin-nav-title-full {
            font-size: 1rem;
            margin-left: 0.5rem;
          }
          .admin-nav-title-short {
            display: none;
          }
          .admin-nav-desktop {
            display: none !important;
          }
          .admin-nav-hamburger {
            display: block !important;
          }
          .admin-nav-mobile.open {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .admin-nav-title-full {
            display: none;
          }
          .admin-nav-title-short {
            display: inline;
            margin-left: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
          }
          .admin-nav-logo-img {
            width: 72px;
          }
        }
      `}</style>
    </>
  );
}
