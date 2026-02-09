'use client';

import dynamic from 'next/dynamic';
import AnalyticsTracker from './AnalyticsTracker';
import PwaRegister from './PwaRegister';
import ConsentBanner from './ConsentBanner';

const ToastProvider = dynamic(
  () => import('./ToastProvider').then((m) => ({ default: m.ToastProvider })),
  { ssr: false }
);

export default function ClientAppShell({ children }) {
  return (
    <ToastProvider>
      <AnalyticsTracker />
      <PwaRegister />
      {children}
      <ConsentBanner />
    </ToastProvider>
  );
}
