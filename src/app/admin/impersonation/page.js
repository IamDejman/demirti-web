'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';
import { getAuthHeaders } from '@/lib/authClient';

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.5rem',
};

const INPUT_STYLE = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.9375rem',
  color: 'var(--text-color)',
  background: '#fff',
  boxSizing: 'border-box',
};

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

export default function AdminImpersonationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleImpersonate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email.trim()) return;
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setMessageType('success');
      setMessage('Impersonation session opened in a new tab.');
      const params = new URLSearchParams({ redirect: '/dashboard' });
      if (data.user.email) params.set('email', data.user.email);
      const url = `/impersonate?${params.toString()}`;
      window.open(url, '_blank');
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to impersonate');
    }
  };

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <AdminPageHeader
          title="Impersonation"
          description="Open a student session for support and troubleshooting."
        />

        {message && (
          <div style={{
            ...CARD_STYLE,
            padding: '0.875rem 1rem',
            background: messageType === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            borderColor: messageType === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)',
            color: messageType === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: messageType === 'success' ? '#059669' : '#dc2626',
              flexShrink: 0,
            }} />
            {message}
          </div>
        )}

        <div style={CARD_STYLE}>
          <form onSubmit={handleImpersonate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Student email</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.5rem',
                    background: 'var(--primary-color, #0052a3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Impersonate
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
