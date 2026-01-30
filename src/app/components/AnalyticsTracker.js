'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/tracker';
import { hasConsent } from '@/lib/consent';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (hasConsent()) {
      trackPageView();
    }
  }, [pathname]);

  return null;
}
