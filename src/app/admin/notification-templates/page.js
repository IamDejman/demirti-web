'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const emptyForm = {
  eventKey: '',
  titleTemplate: '',
  bodyTemplate: '',
  emailEnabled: true,
  inAppEnabled: true,
};

export default function AdminNotificationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const res = await fetch('/api/admin/notification-templates', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.templates) setTemplates(data.templates);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.eventKey.trim()) return;
    const endpoint = editingId ? `/api/admin/notification-templates/${editingId}` : '/api/admin/notification-templates';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(editingId ? 'Template updated.' : 'Template created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessage(data.error || 'Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setForm({
      eventKey: template.event_key || '',
      titleTemplate: template.title_template || '',
      bodyTemplate: template.body_template || '',
      emailEnabled: template.email_enabled !== false,
      inAppEnabled: template.in_app_enabled !== false,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/notification-templates/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Notification Templates</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit template' : 'Create template'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Event key (e.g. assignment_posted)"
              value={form.eventKey}
              onChange={(e) => setForm((f) => ({ ...f, eventKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Title template"
              value={form.titleTemplate}
              onChange={(e) => setForm((f) => ({ ...f, titleTemplate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              rows={3}
              placeholder="Body template"
              value={form.bodyTemplate}
              onChange={(e) => setForm((f) => ({ ...f, bodyTemplate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.inAppEnabled}
                onChange={(e) => setForm((f) => ({ ...f, inAppEnabled: e.target.checked }))}
              />
              In-app enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) => setForm((f) => ({ ...f, emailEnabled: e.target.checked }))}
              />
              Email enabled
            </label>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
              {editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="ml-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates yet.</p>
          ) : (
            <ul className="space-y-3">
              {templates.map((t) => (
                <li key={t.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{t.event_key}</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(t)} className="text-xs text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => handleDelete(t.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    In-app: {t.in_app_enabled !== false ? 'On' : 'Off'} · Email: {t.email_enabled !== false ? 'On' : 'Off'}
                  </p>
                  {t.title_template && <p className="text-sm text-gray-500 mt-1">Title: {t.title_template}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
}
