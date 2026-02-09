'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminNavigationLoader from './AdminNavigationLoader';
import AuditPageViewTracker from './AuditPageViewTracker';

const AUTH_PATHS = ['/admin/login', '/admin/forgot-password'];
const STORAGE_KEY = 'admin_sidebar_collapsed';

const ADMIN_ROUTES_TO_PREFETCH = [
  '/admin',
  '/admin/scholarships',
  '/admin/sponsored-applications',
  '/admin/discounts',
  '/admin/send-bootcamp-welcome',
  '/admin/bulk-email',
  '/admin/cohorts',
  '/admin/course-templates',
  '/admin/users',
  '/admin/announcements',
  '/admin/certificates',
  '/admin/jobs',
  '/admin/professionals',
  '/admin/sample-projects',
  '/admin/analytics',
  '/admin/goals',
  '/admin/funnels',
  '/admin/audit-logs',
  '/admin/exports',
  '/admin/config',
  '/admin/notification-templates',
  '/admin/moderation',
  '/admin/impersonation',
  '/admin/ai-settings',
  '/admin/ai-usage',
];

export default function AdminLayoutShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === 'true');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) return;
    const prefetchRoutes = () => {
      ADMIN_ROUTES_TO_PREFETCH.filter((r) => r !== pathname).forEach((href) => {
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      });
    };
    const useIdle = typeof requestIdleCallback !== 'undefined';
    const id = useIdle ? requestIdleCallback(prefetchRoutes, { timeout: 2000 }) : setTimeout(prefetchRoutes, 100);
    return () => (useIdle ? cancelIdleCallback(id) : clearTimeout(id));
  }, [pathname, isAuthPage, router]);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (isAuthPage) {
    return <AdminNavigationLoader>{children}</AdminNavigationLoader>;
  }

  const sidebarWidth = collapsed ? 72 : 280;
  return (
    <AdminNavigationLoader>
    <AuditPageViewTracker />
    <div className="admin-app">
      <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <main className="admin-main" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
      <style jsx>{`
        .admin-app {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
        }
        .admin-main {
          flex: 1;
          min-width: 0;
          min-height: 100vh;
          background-color: #ffffff;
          padding: 2.5rem 2rem 2rem 2rem;
          overflow-y: auto;
          transition: margin-left 0.2s ease;
          position: relative;
          z-index: 0;
        }
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0 !important;
            padding: 1rem;
            padding-top: 60px;
          }
        }
      `}</style>
    </div>
    </AdminNavigationLoader>
  );
}
