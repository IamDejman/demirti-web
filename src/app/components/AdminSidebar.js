'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const FLYOUT_CLOSE_DELAY_MS = 150;

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  applications: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6M9 18h6" />
    </svg>
  ),
  lms: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  ),
  content: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h6M9 18h6M9 12h6" />
    </svg>
  ),
  analytics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  adminTools: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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
};

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { id: 'applications', label: 'Applications', icon: 'applications', items: [
    { href: '/admin/scholarships', label: 'Scholarships' },
    { href: '/admin/sponsored-applications', label: 'Sponsored' },
    { href: '/admin/discounts', label: 'Discounts' },
    { href: '/admin/send-bootcamp-welcome', label: 'Send Email' },
    { href: '/admin/bulk-email', label: 'Bulk Email' },
  ]},
  { id: 'lms', label: 'LMS', icon: 'lms', items: [
    { href: '/admin/cohorts', label: 'Cohorts' },
    { href: '/admin/course-templates', label: 'Course Templates' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/certificates', label: 'Certificates' },
  ]},
  { id: 'content', label: 'Content', icon: 'content', items: [
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/professionals', label: 'Professionals' },
    { href: '/admin/sample-projects', label: 'Projects' },
  ]},
  { id: 'analytics', label: 'Analytics', icon: 'analytics', items: [
    { href: '/admin/audit-logs', label: 'Audit Logs' },
    { href: '/admin/exports', label: 'Exports' },
  ]},
  { id: 'settings', label: 'Settings', icon: 'settings', items: [
    { href: '/admin/config', label: 'Config' },
    { href: '/admin/notification-templates', label: 'Notif Templates' },
    { href: '/admin/audit-logs', label: 'Audit Logs' },
  ]},
  { id: 'adminTools', label: 'Admin Tools', icon: 'adminTools', items: [
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/impersonation', label: 'Impersonate' },
  ]},
  { id: 'ai', label: 'AI', icon: 'ai', items: [
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

export default function AdminSidebar({ collapsed = false, onToggleCollapse }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flyoutSection, setFlyoutSection] = useState(null);
  const [flyoutAnchorRect, setFlyoutAnchorRect] = useState(null);
  const [collapsedTooltip, setCollapsedTooltip] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const flyoutCloseTimeoutRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const showCollapsedTooltip = (label, el) => {
    setCollapsedTooltip(label);
    if (el && typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect();
      setTooltipAnchor({ top: rect.top + rect.height / 2 });
    } else {
      setTooltipAnchor(null);
    }
  };
  const hideCollapsedTooltip = () => {
    setCollapsedTooltip(null);
    setTooltipAnchor(null);
  };

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
    if (collapsed) {
      setFlyoutSection((prev) => (prev === id ? null : id));
    } else {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const openFlyoutOnHover = (id, anchorEl) => {
    if (collapsed) {
      if (flyoutCloseTimeoutRef.current) {
        clearTimeout(flyoutCloseTimeoutRef.current);
        flyoutCloseTimeoutRef.current = null;
      }
      if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
        const rect = anchorEl.getBoundingClientRect();
        setFlyoutAnchorRect({ top: rect.top, left: rect.right + 4, height: rect.height });
      } else {
        setFlyoutAnchorRect(null);
      }
      setFlyoutSection(id);
    }
  };

  const scheduleCloseFlyout = () => {
    if (!collapsed) return;
    if (flyoutCloseTimeoutRef.current) clearTimeout(flyoutCloseTimeoutRef.current);
    flyoutCloseTimeoutRef.current = setTimeout(() => {
      flyoutCloseTimeoutRef.current = null;
      setFlyoutSection(null);
      setFlyoutAnchorRect(null);
    }, FLYOUT_CLOSE_DELAY_MS);
  };

  const cancelCloseFlyout = () => {
    if (flyoutCloseTimeoutRef.current) {
      clearTimeout(flyoutCloseTimeoutRef.current);
      flyoutCloseTimeoutRef.current = null;
    }
  };

  const closeFlyout = () => {
    if (flyoutCloseTimeoutRef.current) {
      clearTimeout(flyoutCloseTimeoutRef.current);
      flyoutCloseTimeoutRef.current = null;
    }
    setFlyoutSection(null);
    setFlyoutAnchorRect(null);
  };

  useEffect(() => {
    return () => {
      if (flyoutCloseTimeoutRef.current) clearTimeout(flyoutCloseTimeoutRef.current);
    };
  }, []);

  const isActive = (path) => pathname === path || (path !== '/admin' && pathname.startsWith(path));

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    } catch {
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
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-header">
            <Link
              href="/admin"
              className="admin-sidebar-logo"
              onClick={() => { setMobileOpen(false); closeFlyout(); }}
            >
              {collapsed ? (
                <Image src="/favicon.ico" alt="CVERSE" width={32} height={32} className="admin-sidebar-logo-img" priority />
              ) : (
                <Image src="/logo.png" alt="CVERSE Admin" width={120} height={40} className="admin-sidebar-logo-img" style={{ width: 'auto', height: 'auto' }} priority />
              )}
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="admin-sidebar-collapse-btn"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
          </div>

          <nav className="admin-sidebar-nav">
            {NAV_ITEMS.map((item) => {
              if (item.href) {
                return (
                  <div
                    key={item.href}
                    className="admin-sidebar-parent"
                    onMouseEnter={(e) => collapsed && showCollapsedTooltip(item.label, e.currentTarget)}
                    onMouseLeave={() => collapsed && hideCollapsedTooltip()}
                  >
                    <div
                      className={`admin-sidebar-parent-btn admin-sidebar-dashboard-link ${isActive(item.href) ? 'active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Link
                        href={item.href}
                        onClick={() => { setMobileOpen(false); closeFlyout(); }}
                        className="admin-sidebar-dashboard-link-inner"
                        aria-label={collapsed ? item.label : undefined}
                      >
                        <span className="admin-sidebar-item-content">
                          <span className="admin-sidebar-icon">{ICONS[item.icon]}</span>
                          {!collapsed && <span>{item.label}</span>}
                        </span>
                        {!collapsed && <span className="admin-sidebar-chevron-spacer" aria-hidden="true" />}
                      </Link>
                    </div>
                  </div>
                );
              }
              const isExpanded = expandedSections.has(item.id);
              const flyoutOpen = flyoutSection === item.id;
              const listId = `admin-sidebar-${item.id}`;
              return (
                <div
                  key={item.id}
                  className="admin-sidebar-parent admin-sidebar-parent-with-flyout"
                  onMouseEnter={(e) => collapsed && (openFlyoutOnHover(item.id, e.currentTarget), showCollapsedTooltip(item.label, e.currentTarget))}
                  onMouseLeave={() => collapsed && (scheduleCloseFlyout(), hideCollapsedTooltip())}
                >
                  <button
                    type="button"
                    className={`admin-sidebar-parent-btn ${isExpanded ? 'expanded' : ''} ${getSectionWithActiveRoute(pathname) === item.id ? 'has-active' : ''} ${flyoutOpen ? 'flyout-open' : ''}`}
                    onClick={() => toggleSection(item.id)}
                    aria-expanded={collapsed ? flyoutOpen : isExpanded}
                    aria-controls={listId}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? `${item.label} (hover for menu)` : undefined}
                  >
                    <span className="admin-sidebar-item-content">
                      <span className="admin-sidebar-icon">{ICONS[item.icon]}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </span>
                    {!collapsed && (
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
                    )}
                  </button>
                  {!collapsed && isExpanded && (
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
            title={collapsed ? 'Logout' : undefined}
            onMouseEnter={(e) => collapsed && showCollapsedTooltip('Logout', e.currentTarget)}
            onMouseLeave={() => collapsed && hideCollapsedTooltip()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {typeof document !== 'undefined' &&
        collapsed &&
        flyoutSection &&
        flyoutAnchorRect &&
        (() => {
          const item = NAV_ITEMS.find((n) => n.items && n.id === flyoutSection);
          if (!item) return null;
          return createPortal(
            <div
              className="admin-sidebar-flyout-portal"
              role="region"
              aria-label={item.label}
              style={{
                position: 'fixed',
                left: flyoutAnchorRect.left,
                top: flyoutAnchorRect.top,
                zIndex: 1200,
                minWidth: 220,
                maxWidth: 280,
                padding: '0.75rem',
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                border: '1px solid #e8ecf0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                whiteSpace: 'normal',
                pointerEvents: 'auto',
              }}
              onMouseEnter={cancelCloseFlyout}
              onMouseLeave={closeFlyout}
            >
              <style dangerouslySetInnerHTML={{ __html: '.admin-sidebar-flyout-portal a { display: flex; align-items: center; width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; font-weight: 500; color: #4b5563; text-decoration: none; border-radius: 8px; transition: all 0.2s ease; } .admin-sidebar-flyout-portal a:hover { color: #0066cc; background: rgba(0, 102, 204, 0.08); } .admin-sidebar-flyout-portal a.active { color: #0066cc; background: rgba(0, 102, 204, 0.12); font-weight: 600; } .admin-sidebar-flyout-portal .admin-sidebar-flyout-header { font-size: 0.8rem; font-weight: 600; color: #6b7280; padding: 0.5rem 0.75rem; margin-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb; }' }} />
              <div className="admin-sidebar-flyout-header">
                {item.label}
              </div>
              {item.items.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => { setMobileOpen(false); closeFlyout(); }}
                  className={isActive(href) ? 'active' : ''}
                >
                  {label}
                </Link>
              ))}
            </div>,
            document.body
          );
        })()}

      {collapsed && collapsedTooltip && (
        <div
          className="admin-sidebar-collapsed-tooltip"
          role="tooltip"
          style={tooltipAnchor ? { top: tooltipAnchor.top, transform: 'translateY(-50%)' } : undefined}
        >
          {collapsedTooltip}
        </div>
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
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          font-size: 1.25rem;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: box-shadow 0.2s ease;
        }
        .admin-sidebar-toggle:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .admin-sidebar-collapsed-tooltip {
          position: fixed;
          left: 80px;
          top: 50%;
          z-index: 1001;
          padding: 0.5rem 0.75rem;
          background: #1f2937;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          white-space: nowrap;
          pointer-events: none;
          animation: admin-sidebar-tooltip-in 0.15s ease;
        }
        @keyframes admin-sidebar-tooltip-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 999;
          backdrop-filter: blur(2px);
        }
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          min-width: 280px;
          max-width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #fafbfc 0%, #f6f8fa 100%);
          border-right: 1px solid #e8ecf0;
          display: flex;
          flex-direction: column;
          z-index: 1050;
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
          box-shadow: 4px 0 24px rgba(0,0,0,0.04);
          transition: width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease;
        }
        .admin-sidebar.collapsed {
          width: 72px;
          min-width: 72px;
          max-width: 72px;
          overflow-x: visible;
        }
        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          min-height: 100%;
          padding: 1.5rem 0;
          width: 100%;
          box-sizing: border-box;
        }
        .admin-sidebar.collapsed .admin-sidebar-inner {
          padding-left: 0;
          padding-right: 0;
        }
        .admin-sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.5rem 1.5rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid #e8ecf0;
          flex-shrink: 0;
        }
        .admin-sidebar.collapsed .admin-sidebar-header {
          flex-direction: column;
          padding: 0 0.5rem 1rem;
          gap: 0.5rem;
        }
        .admin-sidebar-logo {
          display: block;
          flex-shrink: 0;
          text-align: left;
        }
        .admin-sidebar.collapsed .admin-sidebar-logo {
          text-align: center;
        }
        .admin-sidebar-logo-img {
          width: 120px;
          height: auto;
          display: block;
        }
        .admin-sidebar.collapsed .admin-sidebar-logo-img {
          width: 32px;
          height: 32px;
        }
        .admin-sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 1rem 1.25rem;
          overflow-y: auto;
          gap: 0.5rem;
        }
        .admin-sidebar.collapsed .admin-sidebar-nav {
          padding: 1rem 0.5rem;
          overflow-x: visible;
        }
        .admin-sidebar-parent {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .admin-sidebar-parent-with-flyout {
          position: relative;
        }
        .admin-sidebar.collapsed .admin-sidebar-parent-btn {
          justify-content: center;
          padding: 0.75rem;
        }
        .admin-sidebar-parent > a,
        .admin-sidebar-parent > button {
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 0;
        }
        .admin-sidebar-item-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .admin-sidebar-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          opacity: 0.7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-sidebar-icon svg {
          width: 20px;
          height: 20px;
        }
        .admin-sidebar-parent-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          padding-left: 1rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #374151;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          position: relative;
          box-sizing: border-box;
        }
        .admin-sidebar-parent-btn.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 3px;
          background: #0066cc;
          border-radius: 0 2px 2px 0;
        }
        .admin-sidebar-parent-btn:hover {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.06);
        }
        .admin-sidebar-parent-btn:hover .admin-sidebar-icon {
          opacity: 1;
        }
        .admin-sidebar-parent-btn.has-active {
          color: #0066cc;
        }
        .admin-sidebar-parent-btn.expanded .admin-sidebar-chevron:not(.admin-sidebar-chevron-right) {
          color: #0066cc;
        }
        .admin-sidebar-dashboard-link-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }
        .admin-sidebar.collapsed .admin-sidebar-dashboard-link-inner {
          justify-content: center;
        }
        .admin-sidebar-chevron-spacer {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .admin-sidebar-parent-btn:hover {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.06);
        }
        .admin-sidebar-parent-btn.expanded {
          background: rgba(0, 102, 204, 0.05);
          color: #1f2937;
        }
        .admin-sidebar-chevron {
          flex-shrink: 0;
          transition: transform 0.25s ease;
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
          gap: 0.375rem;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
          border-left: 1px solid #e5e7eb;
          margin-left: 2.25rem;
          padding-left: 1.25rem;
        }
        .admin-sidebar-flyout {
          position: absolute;
          left: 100%;
          top: 0;
          min-width: 220px;
          max-width: 280px;
          padding: 0.75rem;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          border: 1px solid #e8ecf0;
          z-index: 1200;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-left: 4px;
          white-space: normal;
          pointer-events: auto;
        }
        .admin-sidebar-flyout-header {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.25rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .admin-sidebar-flyout .admin-sidebar-link {
          white-space: nowrap;
        }
        .admin-sidebar-collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          margin-left: auto;
          border: none;
          background: rgba(0, 102, 204, 0.08);
          color: #0066cc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .admin-sidebar-collapse-btn:hover {
          background: rgba(0, 102, 204, 0.14);
        }
        .admin-sidebar.collapsed .admin-sidebar-collapse-btn {
          margin-left: 0;
        }
        .admin-sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-align: left;
        }
        .admin-sidebar-link:hover {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.08);
        }
        .admin-sidebar-link.active {
          color: #0066cc;
          background: rgba(0, 102, 204, 0.12);
          font-weight: 600;
        }
        .admin-sidebar-logout {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.5rem;
          margin: 1rem 1.25rem 0;
          border: none;
          background: rgba(220, 53, 69, 0.06);
          color: #dc3545;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s ease;
          border-top: 1px solid #e8ecf0;
        }
        .admin-sidebar.collapsed .admin-sidebar-logout {
          justify-content: center;
          padding: 0.875rem;
        }
        .admin-sidebar-logout:hover {
          background: rgba(220, 53, 69, 0.12);
          color: #c82333;
        }
        @media (max-width: 768px) {
          .admin-sidebar-toggle {
            display: flex;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
            width: 280px !important;
            min-width: 280px !important;
            max-width: 280px !important;
          }
          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .admin-sidebar-backdrop {
            display: block;
          }
          .admin-sidebar-collapse-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
