'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { id: 'applications', label: 'Applications', items: [
    { href: '/admin/scholarships', label: 'Scholarships' },
    { href: '/admin/sponsored-applications', label: 'Sponsored' },
    { href: '/admin/discounts', label: 'Discounts' },
  ]},
  { id: 'lms', label: 'LMS', items: [
    { href: '/admin/cohorts', label: 'Cohorts' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/certificates', label: 'Certificates' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/course-templates', label: 'Course Templates' },
  ]},
  { id: 'content', label: 'Content', items: [
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/professionals', label: 'Professionals' },
    { href: '/admin/sample-projects', label: 'Projects' },
  ]},
  { id: 'analytics', label: 'Analytics', items: [
    { href: '/admin/analytics', label: 'Overview' },
    { href: '/admin/goals', label: 'Goals' },
    { href: '/admin/funnels', label: 'Funnels' },
    { href: '/admin/audit-logs', label: 'Audit Logs' },
    { href: '/admin/exports', label: 'Exports' },
  ]},
  { id: 'settings', label: 'Settings', items: [
    { href: '/admin/config', label: 'Config' },
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/impersonation', label: 'Impersonate' },
    { href: '/admin/notification-templates', label: 'Notif Templates' },
    { href: '/admin/ai-settings', label: 'AI Settings' },
    { href: '/admin/ai-usage', label: 'AI Usage' },
  ]},
];

function getSectionWithActiveRoute(pathname) {
  for (const item of NAV_ITEMS) {
    if (item.items) {
      const hasActive = item.items.some(
        (child) => pathname === child.href || (child.href !== '/admin' && pathname.startsWith(child.href))
      );
      if (hasActive) return item.id;
    }
  }
  return null;
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [expandedSections, setExpandedSections] = useState(() => {
    const activeSection = getSectionWithActiveRoute(pathname);
    return activeSection ? new Set([activeSection]) : new Set();
  });

  useEffect(() => {
    const activeSection = getSectionWithActiveRoute(pathname);
    if (activeSection) {
      setExpandedSections((prev) => (prev.has(activeSection) ? prev : new Set([...prev, activeSection])));
    }
  }, [pathname]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (path) => pathname === path || (path !== '/admin' && pathname.startsWith(path));

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    }
  };

  return (
    <>
      <button
        type="button"
        className="admin-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        ☰
      </button>
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-inner">
          <Link href="/admin" className="admin-sidebar-logo" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="CVERSE Admin" width={120} height={40} className="admin-sidebar-logo-img" />
          </Link>

          <nav className="admin-sidebar-nav">
            {NAV_ITEMS.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              }
              const isExpanded = expandedSections.has(item.id);
              const listId = `admin-sidebar-${item.id}`;
              return (
                <div key={item.id} className="admin-sidebar-parent">
                  <button
                    type="button"
                    className="admin-sidebar-parent-btn"
                    onClick={() => toggleSection(item.id)}
                    aria-expanded={isExpanded}
                    aria-controls={listId}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`admin-sidebar-chevron ${isExpanded ? 'expanded' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div id={listId} className="admin-sidebar-children" role="region">
                      {item.items.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={`admin-sidebar-link ${isActive(href) ? 'active' : ''}`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-sidebar-logout"
            aria-label="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <style jsx>{`
        .admin-sidebar-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1002;
          width: 44px;
          height: 44px;
          border: none;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          font-size: 1.25rem;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }
        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 999;
        }
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          min-width: 260px;
          max-width: 260px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e1e4e8;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow-y: auto;
          flex-shrink: 0;
          box-shadow: 1px 0 0 0 rgba(0,0,0,0.06);
        }
        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 1.25rem 0;
        }
        .admin-sidebar-logo {
          padding: 0 1.25rem 1.25rem;
          border-bottom: 1px solid #e1e4e8;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }
        .admin-sidebar-logo-img {
          width: 120px;
          height: auto;
        }
        .admin-sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 0.75rem;
          overflow-y: auto;
          gap: 0.125rem;
        }
        .admin-sidebar-parent {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .admin-sidebar-parent-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          font-weight: 400;
          color: #606060;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .admin-sidebar-parent-btn:hover {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.08);
        }
        .admin-sidebar-chevron {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .admin-sidebar-chevron.expanded {
          transform: rotate(0deg);
        }
        .admin-sidebar-chevron:not(.expanded) {
          transform: rotate(-90deg);
        }
        .admin-sidebar-children {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding-left: 1.25rem;
          margin-top: 0.125rem;
        }
        .admin-sidebar-link {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          color: #606060;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .admin-sidebar-link:hover {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.08);
        }
        .admin-sidebar-link.active {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.12);
          font-weight: 500;
        }
        .admin-sidebar-logout {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          margin: 0.75rem 1rem 0;
          border: none;
          background: transparent;
          color: #dc3545;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          border-top: 1px solid #e1e4e8;
        }
        .admin-sidebar-logout:hover {
          background: rgba(220, 53, 69, 0.08);
        }
        @media (max-width: 768px) {
          .admin-sidebar-toggle {
            display: flex;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
          }
          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .admin-sidebar-backdrop {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
