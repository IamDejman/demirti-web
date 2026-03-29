'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';
import { getAuthHeaders } from '@/lib/authClient';

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
  padding: '0.625rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.9375rem',
  color: 'var(--text-color)',
  background: '#fff',
  boxSizing: 'border-box',
};

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

export default function AdminAiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [form, setForm] = useState({
    systemPrompt: '',
    dailyLimit: 50,
    maxTokens: 700,
    blockedPhrases: '',
  });

  const loadSettings = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/ai-settings', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.settings) {
      setForm({
        systemPrompt: data.settings.system_prompt || '',
        dailyLimit: data.settings.daily_limit || 50,
        maxTokens: data.settings.max_tokens || 700,
        blockedPhrases: Array.isArray(data.settings.blocked_phrases) ? data.settings.blocked_phrases.join('\n') : '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadSettings();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    const blocked = form.blockedPhrases
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const res = await fetch('/api/admin/ai-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        systemPrompt: form.systemPrompt,
        dailyLimit: Number(form.dailyLimit),
        maxTokens: Number(form.maxTokens),
        blockedPhrases: blocked.length > 0 ? blocked : [],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage('AI settings updated.');
      if (data.settings) {
        setForm((prev) => ({
          ...prev,
          systemPrompt: data.settings.system_prompt || '',
          dailyLimit: data.settings.daily_limit || 50,
          maxTokens: data.settings.max_tokens || 700,
          blockedPhrases: Array.isArray(data.settings.blocked_phrases) ? data.settings.blocked_phrases.join('\n') : '',
        }));
      }
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to save settings.');
    }
  };

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <AdminPageHeader
          title="AI Settings"
          description="Configure the AI assistant: system prompt, limits, and blocked phrases."
        />

        {message && (
          <div style={{
            ...CARD_STYLE,
            padding: '0.875rem 1rem',
            background: messageType === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            borderColor: messageType === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)',
            color: messageType === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: messageType === 'success' ? '#059669' : '#dc2626',
              flexShrink: 0,
            }} />
            {message}
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '30vh',
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
            <p style={{ color: 'var(--text-light)', fontSize: '0.9375rem' }}>Loading settings...</p>
          </div>
        ) : (
          <div style={CARD_STYLE}>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={LABEL_STYLE}>System prompt</label>
                  <textarea
                    rows={5}
                    value={form.systemPrompt}
                    onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                    style={{ ...INPUT_STYLE, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={LABEL_STYLE}>Daily limit</label>
                    <input
                      type="number"
                      value={form.dailyLimit}
                      onChange={(e) => setForm((prev) => ({ ...prev, dailyLimit: e.target.value }))}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Max tokens</label>
                    <input
                      type="number"
                      value={form.maxTokens}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxTokens: e.target.value }))}
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>

                <div>
                  <label style={LABEL_STYLE}>Blocked phrases (one per line)</label>
                  <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '0.375rem', marginTop: 0 }}>
                    Messages containing these phrases will be blocked.
                  </p>
                  <textarea
                    rows={4}
                    value={form.blockedPhrases}
                    onChange={(e) => setForm((prev) => ({ ...prev, blockedPhrases: e.target.value }))}
                    style={{ ...INPUT_STYLE, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    style={{
                      padding: '0.625rem 1.5rem',
                      background: 'var(--primary-color, #0052a3)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
