'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.token) {
        localStorage.setItem('lms_token', data.token);
      }
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'facilitator') router.push('/facilitator');
      else router.push('/dashboard');
    } catch {
      setError('Something went wrong');
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

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="auth-field auth-field-tight">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-link-wrap">
          Don&apos;t have an account? <Link href="/register" className="auth-link">Register</Link>
        </div>
        <div className="auth-link-wrap auth-link-wrap-tight">
          <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
