'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LmsLayoutShell } from '@/app/components/lms';
import { getLmsAuthHeaders, installLms401Interceptor } from '@/lib/authClient';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import AuditPageViewTracker from '@/app/components/AuditPageViewTracker';

export default function FacilitatorLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uninstall = installLms401Interceptor();
    return uninstall;
  }, []);

  useEffect(() => {
    const authenticated = typeof window !== 'undefined' ? localStorage.getItem('lms_authenticated') : null;
    if (!authenticated) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me')
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

  const loadGradingQueue = useCallback(() => {
    fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.submissions) setPendingCount(data.submissions.length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadGradingQueue();
  }, [user, loadGradingQueue]);

  useVisibilityPolling(loadGradingQueue, 60000, !!user);

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
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </LmsLayoutShell>
  );
}
