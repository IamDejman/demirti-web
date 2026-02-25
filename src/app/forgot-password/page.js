'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/app/components/ToastProvider';
import { validatePassword } from '@/lib/passwordPolicy';

const STEPS = { email: 1, otp: 2, password: 3 };
const RESEND_COOLDOWN_SECONDS = 3 * 60; // 3 minutes
const STEP_LABELS = {
  [STEPS.email]: 'Enter your email to receive a reset code.',
  [STEPS.otp]: 'Enter the 6-digit code we sent to your email.',
  [STEPS.password]: 'Choose a new password with letters, numbers, and a special character.',
};
const PASSWORD_GUIDE = 'Use at least 8 characters with letters, numbers, and a special character.';

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(STEPS.email);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (step !== STEPS.otp || resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step, resendCooldown]);

  const requestOtp = async () => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (data.devOtp) setDevOtp(data.devOtp);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return { success: true };
    }
    return { success: false, error: data.error || 'Something went wrong.' };
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await requestOtp();
      if (result.success) {
        showToast({ type: 'success', message: 'Check your email for the code.' });
        setStep(STEPS.otp);
      } else {
        showToast({ type: 'error', message: result.error });
      }
    } catch {
      showToast({ type: 'error', message: 'Something went wrong. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const result = await requestOtp();
      if (result.success) {
        showToast({ type: 'success', message: 'A new code was sent to your email.' });
      } else {
        showToast({ type: 'error', message: result.error });
      }
    } catch {
      showToast({ type: 'error', message: 'Something went wrong. Try again.' });
    } finally {
      setIsResending(false);
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
      const res = await fetch('/api/auth/verify-reset-otp', {
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
    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      showToast({ type: 'error', message: policy.message });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
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
        localStorage.setItem('lms_authenticated', 'true');
        showToast({ type: 'success', message: 'Password updated. Redirecting...' });
        const role = data.user?.role;
        if (role === 'admin') router.push('/admin');
        else if (role === 'facilitator') router.push('/facilitator');
        else router.push('/dashboard');
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Image src="/logo.png" alt="CVERSE" width={48} height={48} className="auth-logo" />
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">{STEP_LABELS[step]}</p>
        </div>

        <div className="auth-steps" aria-hidden="true">
          {[STEPS.email, STEPS.otp, STEPS.password].map((s) => (
            <div
              key={s}
              className={`auth-step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            />
          ))}
        </div>

        {step === STEPS.email && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="auth-field auth-field-tight">
              <label htmlFor="email" className="auth-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="auth-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="auth-btn">
              {isSubmitting ? 'Sending...' : 'Send code'}
            </button>
          </form>
        )}

        {step === STEPS.otp && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            {devOtp && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-800 text-sm font-medium mb-4">
                Dev code: <strong className="font-mono">{devOtp}</strong>
              </div>
            )}
            <div className="auth-field auth-field-tight">
              <label htmlFor="otp" className="auth-label">Verification code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={isSubmitting}
                className="auth-input text-center tracking-[0.35em] font-mono text-lg"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="auth-btn">
              {isSubmitting ? 'Verifying...' : 'Continue'}
            </button>
            <div className="auth-link-wrap" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 || isResending ? 'not-allowed' : 'pointer', padding: 0, font: 'inherit' }}
              >
                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend code in ${formatCountdown(resendCooldown)}` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === STEPS.password && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="auth-field">
              <label htmlFor="newPassword" className="auth-label">New password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="auth-input pr-14"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--neutral-500)' }}>{PASSWORD_GUIDE}</p>
            </div>
            <div className="auth-field auth-field-tight">
              <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="auth-input pr-14"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="auth-btn">
              {isSubmitting ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="auth-link-wrap">
          <Link href="/login" className="auth-link">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
