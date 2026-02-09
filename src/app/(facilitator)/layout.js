'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LmsLayoutShell } from '@/app/components/lms';
import { getLmsAuthHeaders } from '@/lib/authClient';
import AuditPageViewTracker from '@/app/components/AuditPageViewTracker';

export default function FacilitatorLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
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
        if (data.user?.role !== 'facilitator') {
          if (data.user?.role === 'admin') router.push('/admin');
          else if (data.user?.role === 'student' || data.user?.role === 'alumni') router.push('/dashboard');
          else router.push('/login');
          return;
        }
        setUser(data.user);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.submissions) setPendingCount(data.submissions.length);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [user]);

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
    <LmsLayoutShell variant="facilitator" user={user} pendingCount={pendingCount}>
      <AuditPageViewTracker />
      {children}
    </LmsLayoutShell>
  );
}
