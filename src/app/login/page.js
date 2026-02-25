'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '../components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      showToast({ type: 'error', message: 'Email and password are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', message: data.error || 'Login failed' });
        return;
      }
      localStorage.setItem('lms_authenticated', 'true');
      if (data.mustChangePassword) {
        router.push('/change-password');
        return;
      }
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'facilitator') router.push('/facilitator');
      else router.push('/dashboard');
    } catch {
      showToast({ type: 'error', message: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Image src="/logo.png" alt="CVERSE" width={48} height={48} className="auth-logo" priority />
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">CVERSE Academy</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="auth-field auth-field-tight">
            <label htmlFor="password" className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="current-password"
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-link-wrap auth-link-wrap-tight">
          <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
