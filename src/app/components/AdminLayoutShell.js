'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

const AUTH_PATHS = ['/admin/login', '/admin/forgot-password'];
const STORAGE_KEY = 'admin_sidebar_collapsed';

export default function AdminLayoutShell({ children }) {
  const pathname = usePathname();
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
    return <>{children}</>;
  }

  const sidebarWidth = collapsed ? 72 : 280;
  return (
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
          padding: 2rem;
          overflow-y: auto;
          transition: margin-left 0.2s ease;
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
  );
}
