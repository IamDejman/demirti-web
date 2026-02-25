'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';

export default function AdminMfaSettings() {
  const [status, setStatus] = useState(null); // null = loading, { enabled }
  const [setupData, setSetupData] = useState(null); // { secret, uri }
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mfa/status');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      setStatus(data);
    } catch {
      showToast({ type: 'error', message: 'Failed to load MFA status' });
    }
  }, [showToast]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/mfa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { showToast({ type: 'error', message: data.error }); return; }
      setSetupData(data);
    } catch {
      showToast({ type: 'error', message: 'Failed to start MFA setup' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { showToast({ type: 'error', message: data.error }); setCode(''); return; }
      showToast({ type: 'success', message: 'MFA enabled successfully!' });
      setSetupData(null);
      setCode('');
      fetchStatus();
    } catch {
      showToast({ type: 'error', message: 'Failed to enable MFA' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) { showToast({ type: 'error', message: data.error }); setDisableCode(''); return; }
      showToast({ type: 'success', message: 'MFA has been disabled' });
      setDisableCode('');
      fetchStatus();
    } catch {
      showToast({ type: 'error', message: 'Failed to disable MFA' });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading...</div>
    );
  }

  const cardStyle = {
    maxWidth: '560px',
    margin: '2rem auto',
    padding: '2rem',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e1e4e8',
    borderRadius: '8px',
    fontSize: '1.25rem',
    textAlign: 'center',
    letterSpacing: '0.5em',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  };

  const btnPrimary = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.6 : 1,
    width: '100%',
  };

  const btnDanger = { ...btnPrimary, backgroundColor: '#dc2626' };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a href="/admin" style={{ color: '#0066cc', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Dashboard</a>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Two-Factor Authentication
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Add an extra layer of security to your admin account using an authenticator app.
        </p>

        {status.enabled ? (
          <>
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>&#x2713;</span>
              <span style={{ fontWeight: '600', color: '#166534' }}>MFA is enabled</span>
            </div>

            <form onSubmit={handleDisable}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                To disable MFA, enter a code from your authenticator app:
              </p>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                disabled={isLoading}
                style={{ ...inputStyle, marginBottom: '1rem' }}
              />
              <button type="submit" disabled={isLoading || disableCode.length !== 6} style={btnDanger}>
                {isLoading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </form>
          </>
        ) : setupData ? (
          <>
            <div style={{
              padding: '1rem',
              background: '#fffbeb',
              borderRadius: '8px',
              border: '1px solid #fde68a',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>Setup Instructions</p>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Add a new account using the secret key below</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Secret Key (enter manually)</p>
              <code style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                letterSpacing: '0.15em',
                wordBreak: 'break-all',
                color: '#1a1a1a',
                userSelect: 'all',
              }}>
                {setupData.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
            </div>

            <form onSubmit={handleEnable}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
                disabled={isLoading}
                style={{ ...inputStyle, marginBottom: '1rem' }}
              />
              <button type="submit" disabled={isLoading || code.length !== 6} style={btnPrimary}>
                {isLoading ? 'Verifying...' : 'Enable MFA'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>&#x26A0;</span>
              <span style={{ fontWeight: '600', color: '#991b1b' }}>MFA is not enabled</span>
            </div>

            <button onClick={handleSetup} disabled={isLoading} style={btnPrimary}>
              {isLoading ? 'Setting up...' : 'Set Up MFA'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
