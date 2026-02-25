'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const sessionMessage = searchParams.get('message');

  useEffect(() => {
    // Check if already logged in
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    if (!sessionMessage) return;
    const decodedMessage = sessionMessage === 'Session timed out'
      ? 'Your session timed out. Please log in again.'
      : decodeURIComponent(sessionMessage);
    showToast({ type: 'error', message: decodedMessage });
  }, [sessionMessage, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try { data = await response.json(); } catch { data = { error: 'Invalid response from server' }; }

      if (data.requiresMfa) {
        setMfaToken(data.mfaToken);
        setMfaRequired(true);
        setIsSubmitting(false);
        return;
      }

      if (response.ok && data.success) {
        localStorage.setItem('admin_authenticated', 'true');
        showToast({ type: 'success', message: 'Login successful! Redirecting...' });
        setTimeout(() => { router.push('/admin'); }, 500);
      } else {
        showToast({
          type: 'error',
          message: data.error || (response.status === 401 ? 'Invalid email or password.' : 'Login failed. Please try again.'),
        });
        setIsSubmitting(false);
      }
    } catch {
      showToast({ type: 'error', message: 'An error occurred during login. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });

      let data = {};
      try { data = await response.json(); } catch { data = { error: 'Invalid response from server' }; }

      if (response.ok && data.success) {
        localStorage.setItem('admin_authenticated', 'true');
        showToast({ type: 'success', message: 'Login successful! Redirecting...' });
        setTimeout(() => { router.push('/admin'); }, 500);
      } else {
        showToast({ type: 'error', message: data.error || 'Verification failed. Please try again.' });
        setMfaCode('');
        setIsSubmitting(false);
        if (data.code === 'MFA_EXPIRED') {
          setMfaRequired(false);
          setMfaToken('');
        }
      }
    } catch {
      showToast({ type: 'error', message: 'An error occurred. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e1e4e8',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };

  if (mfaRequired) {
    return (
      <main>
        <div className="admin-auth-page">
          <div className="admin-auth-card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                Two-Factor Authentication
              </h1>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <form onSubmit={handleMfaSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="mfaCode" style={labelStyle}>Authentication Code</label>
                <input
                  type="text"
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  disabled={isSubmitting}
                  placeholder="000000"
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    letterSpacing: '0.5em',
                    fontSize: '1.5rem',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.outline = 'none'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e1e4e8'; }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || mfaCode.length !== 6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: isSubmitting || mfaCode.length !== 6 ? '#999' : '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: isSubmitting || mfaCode.length !== 6 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem',
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setMfaToken('');
                  setMfaCode('');
                  setPassword('');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e1e4e8',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Back to login
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="admin-auth-page">
        <div className="admin-auth-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '0.5rem'
            }}>
              Admin Login
            </h1>
            <p style={{
              color: '#666',
              fontSize: '0.95rem'
            }}>
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={labelStyle}>Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e1e4e8'; }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  style={{ ...inputStyle, paddingRight: '4.5rem' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.outline = 'none'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e1e4e8'; }}
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(!showPassword); }}
                  disabled={isSubmitting}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    color: '#666',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    padding: '0.5rem 0.75rem',
                    minWidth: '60px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    zIndex: 10,
                    pointerEvents: isSubmitting ? 'none' : 'auto',
                  }}
                  onMouseEnter={(e) => { if (!isSubmitting) { e.target.style.color = '#0066cc'; e.target.style.backgroundColor = '#f0f0f0'; } }}
                  onMouseLeave={(e) => { if (!isSubmitting) { e.target.style.color = '#666'; e.target.style.backgroundColor = 'transparent'; } }}
                  onTouchStart={(e) => { e.preventDefault(); if (!isSubmitting) { e.target.style.color = '#0066cc'; e.target.style.backgroundColor = '#f0f0f0'; } }}
                  onTouchEnd={(e) => { e.preventDefault(); if (!isSubmitting) { setShowPassword(!showPassword); e.target.style.color = '#666'; e.target.style.backgroundColor = 'transparent'; } }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <p style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
              <a
                href="/admin/forgot-password"
                style={{ color: '#0066cc', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Forgot password?
              </a>
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: isSubmitting ? '#999' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.target.style.backgroundColor = '#004d99'; e.target.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={(e) => { if (!isSubmitting) { e.target.style.backgroundColor = '#0066cc'; e.target.style.transform = 'translateY(0)'; } }}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
