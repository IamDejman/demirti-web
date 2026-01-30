'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../components/ToastProvider';

const STEPS = { email: 1, otp: 2, password: 3 };

export default function AdminForgotPassword() {
  const [step, setStep] = useState(STEPS.email);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const inputStyle = {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e1e4e8',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };
  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: isSubmitting ? '#999' : '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.devOtp) setDevOtp(data.devOtp);
        showToast({ type: 'success', message: 'Check your email for the code.' });
        setStep(STEPS.otp);
      } else {
        showToast({ type: 'error', message: data.error || 'Something went wrong.' });
      }
    } catch {
      showToast({ type: 'error', message: 'Something went wrong. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      showToast({ type: 'error', message: 'Enter the code from your email.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep(STEPS.password);
      } else {
        showToast({ type: 'error', message: data.error || 'Invalid or expired code.' });
      }
    } catch {
      showToast({ type: 'error', message: 'Something went wrong. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_token', data.token || 'authenticated');
        showToast({ type: 'success', message: 'Password updated. Redirecting...' });
        router.push('/admin');
      } else {
        showToast({ type: 'error', message: data.error || 'Something went wrong.' });
      }
    } catch {
      showToast({ type: 'error', message: 'Something went wrong. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <div className="admin-auth-page">
        <div className="admin-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            Forgot password
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            {step === STEPS.email && 'Enter your admin email to receive a code.'}
            {step === STEPS.otp && 'Enter the code we sent to your email.'}
            {step === STEPS.password && 'Set a new password.'}
          </p>
        </div>

        {step === STEPS.email && (
          <form onSubmit={handleRequestOtp}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? 'Sending...' : 'Send code'}
            </button>
          </form>
        )}

        {step === STEPS.otp && (
          <form onSubmit={handleVerifyOtp}>
            {devOtp && (
              <p style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem', color: '#0369a1' }}>
                Dev code: <strong>{devOtp}</strong>
              </p>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="otp" style={labelStyle}>Code</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={isSubmitting}
                style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center' }}
              />
            </div>
            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              Continue
            </button>
          </form>
        )}

        {step === STEPS.password && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="newPassword" style={labelStyle}>New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  style={{ ...inputStyle, paddingRight: '4.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  style={{ ...inputStyle, paddingRight: '4.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? 'Continuing...' : 'Continue'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/admin/login" style={{ color: '#0066cc', textDecoration: 'none', fontSize: '0.95rem' }}>
            Back to login
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}
