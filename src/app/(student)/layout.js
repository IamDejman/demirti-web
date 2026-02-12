'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LmsLayoutShell } from '@/app/components/lms';
import { getLmsAuthHeaders } from '@/lib/authClient';
import AuditPageViewTracker from '@/app/components/AuditPageViewTracker';

export default function StudentLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: getLmsAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/login');
          return;
        }
        if (data.user?.mustChangePassword) {
          router.push('/change-password');
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <LmsLayoutShell variant="student" user={user}>
      <AuditPageViewTracker />
      {children}
    </LmsLayoutShell>
  );
}
