'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader } from '../../components/admin';

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

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
  padding: '0.875rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '1.25rem',
  textAlign: 'center',
  letterSpacing: '0.5em',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  color: 'var(--text-color)',
};

export default function AdminMfaSettings() {
  const [status, setStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
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
      <div className="admin-dashboard admin-content-area" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        gap: '1rem',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #dbeafe',
          borderTopColor: 'var(--primary-color, #0052a3)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-light)', fontSize: '0.9375rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <AdminPageHeader
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your admin account using an authenticator app."
          breadcrumb={
            <a href="/admin" style={{ color: 'var(--text-light)', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Dashboard
            </a>
          }
        />

        {status.enabled ? (
          <>
            {/* Enabled status */}
            <div style={{
              ...CARD_STYLE,
              padding: '0.875rem 1rem',
              background: 'rgba(5, 150, 105, 0.08)',
              borderColor: 'rgba(5, 150, 105, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#059669',
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600, color: '#059669', fontSize: '0.875rem' }}>MFA is enabled</span>
            </div>

            {/* Disable form */}
            <div style={CARD_STYLE}>
              <form onSubmit={handleDisable}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem', marginTop: 0 }}>
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
                  style={{ ...INPUT_STYLE, marginBottom: '1rem' }}
                />
                <button
                  type="submit"
                  disabled={isLoading || disableCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? 'Disabling...' : 'Disable MFA'}
                </button>
              </form>
            </div>
          </>
        ) : setupData ? (
          <>
            {/* Setup instructions */}
            <div style={{
              ...CARD_STYLE,
              background: 'rgba(234, 179, 8, 0.06)',
              borderColor: 'rgba(234, 179, 8, 0.2)',
            }}>
              <p style={{
                ...LABEL_STYLE,
                color: '#92400e',
                fontSize: '0.75rem',
                marginBottom: '0.75rem',
              }}>Setup Instructions</p>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Add a new account using the secret key below</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
            </div>

            {/* Secret key */}
            <div style={{
              ...CARD_STYLE,
              textAlign: 'center',
              background: '#f9fafb',
            }}>
              <p style={{ ...LABEL_STYLE, marginBottom: '0.75rem' }}>Secret Key (enter manually)</p>
              <code style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                wordBreak: 'break-all',
                color: 'var(--text-color)',
                userSelect: 'all',
              }}>
                {setupData.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
            </div>

            {/* Verification form */}
            <div style={CARD_STYLE}>
              <form onSubmit={handleEnable}>
                <label style={LABEL_STYLE}>Verification Code</label>
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
                  style={{ ...INPUT_STYLE, marginBottom: '1rem' }}
                />
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    background: 'var(--primary-color, #0052a3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Enable MFA'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Not enabled status */}
            <div style={{
              ...CARD_STYLE,
              padding: '0.875rem 1rem',
              background: 'rgba(220, 38, 38, 0.06)',
              borderColor: 'rgba(220, 38, 38, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#dc2626',
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.875rem' }}>MFA is not enabled</span>
            </div>

            {/* Setup button */}
            <div style={CARD_STYLE}>
              <button
                onClick={handleSetup}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary-color, #0052a3)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Setting up...' : 'Set Up MFA'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
