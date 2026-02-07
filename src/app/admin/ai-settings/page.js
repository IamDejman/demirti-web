'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
} from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

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
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <AdminPageHeader
        title="AI Settings"
        description="Configure the AI assistant: system prompt, limits, and blocked phrases."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      {loading ? (
        <p className="admin-loading">Loading settings...</p>
      ) : (
        <AdminCard>
          <form onSubmit={handleSave} className="admin-form-section">
            <AdminFormField label="System prompt">
              <textarea
                rows={5}
                value={form.systemPrompt}
                onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <div className="admin-form-grid">
              <AdminFormField label="Daily limit">
                <input
                  type="number"
                  value={form.dailyLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, dailyLimit: e.target.value }))}
                  className={inputClass}
                />
              </AdminFormField>
              <AdminFormField label="Max tokens">
                <input
                  type="number"
                  value={form.maxTokens}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxTokens: e.target.value }))}
                  className={inputClass}
                />
              </AdminFormField>
            </div>
            <AdminFormField
              label="Blocked phrases (one per line)"
              hint="Messages containing these phrases will be blocked."
            >
              <textarea
                rows={4}
                value={form.blockedPhrases}
                onChange={(e) => setForm((prev) => ({ ...prev, blockedPhrases: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminButton type="submit" variant="primary">
              Save settings
            </AdminButton>
          </form>
        </AdminCard>
      )}
    </div>
  );
}
