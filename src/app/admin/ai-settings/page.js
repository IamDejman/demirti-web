'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminAiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
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
      setMessage(data.error || 'Failed to save settings.');
    }
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        {loading ? (
          <p className="text-gray-500 mt-4">Loading settings...</p>
        ) : (
          <form onSubmit={handleSave} className="mt-6 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">System prompt</label>
              <textarea
                rows={5}
                value={form.systemPrompt}
                onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Daily limit</label>
                <input
                  type="number"
                  value={form.dailyLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, dailyLimit: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max tokens</label>
                <input
                  type="number"
                  value={form.maxTokens}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxTokens: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Blocked phrases (one per line)</label>
              <textarea
                rows={4}
                value={form.blockedPhrases}
                onChange={(e) => setForm((prev) => ({ ...prev, blockedPhrases: e.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Messages containing these phrases will be blocked.</p>
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
              Save settings
            </button>
          </form>
        )}
    </div>
  );
}
