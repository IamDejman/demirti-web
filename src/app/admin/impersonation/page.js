'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
} from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

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
    if (res.ok && data.token) {
      setMessageType('success');
      setMessage('Impersonation session opened in a new tab.');
      const url = `/impersonate?token=${encodeURIComponent(data.token)}&redirect=/dashboard`;
      window.open(url, '_blank');
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to impersonate');
    }
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Impersonation"
        description="Open a student session for support and troubleshooting."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard>
        <form onSubmit={handleImpersonate} className="admin-form-section">
          <AdminFormField label="Student email">
            <input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminButton type="submit" variant="primary">
            Impersonate
          </AdminButton>
        </form>
      </AdminCard>
    </div>
  );
}
