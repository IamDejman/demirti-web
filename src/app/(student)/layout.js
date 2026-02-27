'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LmsLayoutShell } from '@/app/components/lms';
import { installLms401Interceptor, getLmsAuthHeaders } from '@/lib/authClient';

const NOTIFICATIONS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13 21a1 1 0 0 1-2 0" />
  </svg>
);
import ErrorBoundary from '@/app/components/ErrorBoundary';
import AuditPageViewTracker from '@/app/components/AuditPageViewTracker';
import ImpersonationBanner from '@/app/components/ImpersonationBanner';

export default function StudentLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    const uninstall = installLms401Interceptor();
    return uninstall;
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const [notifRes, announceRes] = await Promise.all([
        fetch('/api/notifications?unreadOnly=true&limit=100', { headers: getLmsAuthHeaders() }),
        fetch('/api/announcements/unread-count', { headers: getLmsAuthHeaders() }),
      ]);
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotifications(notifData.notifications?.length ?? 0);
      }
      if (announceRes.ok) {
        const annData = await announceRes.json();
        setUnreadAnnouncements(annData.count ?? 0);
      }
    } catch {}
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
        const role = data.user?.role;
        if (role !== 'student' && role !== 'alumni') {
          if (role === 'admin') router.push('/admin');
          else if (role === 'facilitator') router.push('/facilitator');
          else router.push('/login');
          return;
        }
        setUser(data.user);
        // Fetch unread counts once authenticated
        fetchUnreadCounts();
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, fetchUnreadCounts]);

  // Poll for unread counts every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchUnreadCounts, 60000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCounts]);

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
    <LmsLayoutShell
      variant="student"
      user={user}
      unreadAnnouncements={unreadAnnouncements}
      topBarContent={
        <Link
          href="/dashboard/notifications"
          className="lms-topnav-icon-btn"
          aria-label="Notifications"
        >
          {NOTIFICATIONS_ICON}
          {unreadNotifications > 0 && (
            <span className="lms-topnav-icon-badge">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>
      }
    >
      <ImpersonationBanner />
      <AuditPageViewTracker />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </LmsLayoutShell>
  );
}
