'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

const AUTH_PATHS = ['/admin/login', '/admin/forgot-password'];

export default function AdminLayoutShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="admin-app">
      <AdminSidebar />
      <main className="admin-main">
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
          margin-left: 260px;
          min-height: 100vh;
          background-color: #ffffff;
          padding: 2rem;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 60px;
          }
        }
      `}</style>
    </div>
  );
}
