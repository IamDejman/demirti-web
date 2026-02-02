'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/login');
          return;
        }
        const role = data.user?.role;
        if (role !== 'student' && role !== 'alumni') {
          if (role === 'admin') router.push('/admin');
          else if (role === 'facilitator') router.push('/facilitator');
          else router.push('/login');
          return;
        }
        setUser(data.user);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            CVERSE Academy
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className={`text-sm font-medium ${pathname === '/dashboard' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
              Dashboard
            </Link>
            <Link href="/dashboard/assignments" className={`text-sm font-medium ${pathname?.startsWith('/dashboard/assignments') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
              Assignments
            </Link>
            <span className="text-sm text-gray-500">{user.firstName || user.email}</span>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
                localStorage.removeItem('lms_token');
                router.push('/login');
              }}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
