'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const adminToken = localStorage.getItem('admin_token');
  const lmsToken = localStorage.getItem('lms_token');
  const token = adminToken || lmsToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AuditPageViewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef(null);

  useEffect(() => {
    if (!pathname) return;
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true';
    const hasLms = typeof window !== 'undefined' && !!localStorage.getItem('lms_token');
    if (!isAdmin && !hasLms) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    fetch('/api/audit/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ path: pathname, pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
