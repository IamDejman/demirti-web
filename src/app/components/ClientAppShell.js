'use client';

import dynamic from 'next/dynamic';

const ToastProvider = dynamic(
  () => import('./ToastProvider').then((m) => ({ default: m.ToastProvider })),
  { ssr: false }
);

const PwaRegister = dynamic(() => import('./PwaRegister'), { ssr: false });

export default function ClientAppShell({ children }) {
  return (
    <ToastProvider>
      <PwaRegister />
      {children}
    </ToastProvider>
  );
}
