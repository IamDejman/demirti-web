'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getLmsAuthHeaders } from '@/lib/authClient';

function redirectByRole(router, role) {
  if (role === 'admin') router.push('/admin');
  else if (role === 'facilitator') router.push('/facilitator');
  else router.push('/dashboard');
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const authenticated = typeof window !== 'undefined' ? localStorage.getItem('lms_authenticated') : null;
    if (!authenticated) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/login');
          return;
        }
        if (!data.user?.mustChangePassword) {
          redirectByRole(router, data.user?.role);
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ newPassword, confirmPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }
      const meRes = await fetch('/api/auth/me', { headers: getLmsAuthHeaders() });
      const meData = await meRes.json();
      redirectByRole(router, meData.user?.role);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Image src="/logo.png" alt="CVERSE" width={48} height={48} className="auth-logo" priority />
          <h1 className="auth-title">Set a new password</h1>
          <p className="auth-subtitle">You signed in with a temporary password. Please choose a new password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <div className="auth-field auth-field-tight">
            <label htmlFor="new-password" className="auth-label">New password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="new-password"
                style={{ paddingRight: '4rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted, #6b7280)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.5rem',
                  minWidth: '56px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="auth-field auth-field-tight">
            <label htmlFor="confirm-password" className="auth-label">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="new-password"
                style={{ paddingRight: '4rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted, #6b7280)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.5rem',
                  minWidth: '56px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? 'Updating...' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
