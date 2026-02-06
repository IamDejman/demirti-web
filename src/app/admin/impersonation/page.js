'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminImpersonationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

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
      const url = `/impersonate?token=${encodeURIComponent(data.token)}&redirect=/dashboard`;
      window.open(url, '_blank');
      setMessage('Impersonation session opened in a new tab.');
    } else {
      setMessage(data.error || 'Failed to impersonate');
    }
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Impersonation</h1>
        <p className="text-sm text-gray-600 mt-2">Open a student session for support and troubleshooting.</p>
        {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
        <form onSubmit={handleImpersonate} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Student email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
            Impersonate
          </button>
        </form>
    </div>
  );
}
