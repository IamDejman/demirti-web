'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AuditPageViewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef(null);

  useEffect(() => {
    if (!pathname) return;
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true';
    const hasLms = typeof window !== 'undefined' && !!localStorage.getItem('lms_authenticated');
    if (!isAdmin && !hasLms) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    fetch('/api/audit/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
