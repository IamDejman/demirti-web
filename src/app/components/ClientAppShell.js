'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from './ThemeProvider';

const ToastProvider = dynamic(
  () => import('./ToastProvider').then((m) => ({ default: m.ToastProvider })),
  { ssr: false }
);

const PwaRegister = dynamic(() => import('./PwaRegister'), { ssr: false });
const OfflineIndicator = dynamic(() => import('./OfflineIndicator'), { ssr: false });
const CookieConsent = dynamic(() => import('./CookieConsent'), { ssr: false });

export default function ClientAppShell({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PwaRegister />
        <OfflineIndicator />
        <CookieConsent />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
