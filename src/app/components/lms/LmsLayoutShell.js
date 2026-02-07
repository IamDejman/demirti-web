'use client';

import { useState, useEffect } from 'react';
import LmsSidebar from './LmsSidebar';

const STORAGE_KEY = 'lms_sidebar_collapsed';

export default function LmsLayoutShell({ variant = 'student', children, user, pendingCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="lms-app flex min-h-screen bg-gray-50">
      <LmsSidebar
        variant={variant}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        user={user}
        pendingCount={pendingCount}
      />
      <main
        className="lms-main flex-1 min-w-0 min-h-screen overflow-y-auto transition-[margin] duration-200"
        style={mounted ? { marginLeft: sidebarWidth } : {}}
      >
        <div className="lms-main-content px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <style jsx>{`
        @media (max-width: 1024px) {
          .lms-main {
            margin-left: 0 !important;
            padding-top: 56px;
          }
        }
      `}</style>
    </div>
  );
}
