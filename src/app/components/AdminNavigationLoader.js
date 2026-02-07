'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminNavigationLoader({ children }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a[href^="/admin"]');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.getAttribute('rel') === 'external') return;
      if (anchor.href && !anchor.href.startsWith(window.location.origin)) return;
      const href = anchor.getAttribute('href');
      if (!href || href === pathname) return;
      setIsNavigating(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      setIsNavigating(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = setTimeout(() => setIsNavigating(false), 10000);
    return () => clearTimeout(timeout);
  }, [isNavigating]);

  return (
    <>
      {children}
      {isNavigating && (
        <div
          className="admin-loading-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <div className="admin-loading-spinner" />
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </>
  );
}
