'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImpersonationBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const impersonating = localStorage.getItem('impersonating');
    const storedEmail = localStorage.getItem('impersonate_email') || '';
    setVisible(impersonating === 'true');
    setEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.classList.add('impersonation-banner-visible');
      return () => document.body.classList.remove('impersonation-banner-visible');
    }
  }, [visible]);

  const handleEndImpersonation = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    localStorage.removeItem('impersonating');
    localStorage.removeItem('lms_authenticated');
    localStorage.removeItem('impersonate_email');
    router.push('/admin');
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'var(--status-warning-bg, #fff3cd)',
        color: 'var(--status-warning-text, #856404)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <span>You are viewing as {email || 'user'}</span>
      <button
        type="button"
        onClick={handleEndImpersonation}
        className="px-3 py-1.5 text-sm font-medium rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
      >
        End Impersonation
      </button>
    </div>
  );
}
