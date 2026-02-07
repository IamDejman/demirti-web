'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
  AdminEmptyState,
} from '../../components/admin';

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

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

export default function AdminNotificationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

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
      setMessageType('success');
      setMessage(editingId ? 'Template updated.' : 'Template created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessageType('error');
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

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Notification Templates"
        description="Edit notification templates for events. Toggle in-app and email delivery per template."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title={editingId ? 'Edit template' : 'Create template'}>
        <form onSubmit={handleSubmit} className="admin-form-section">
          <AdminFormField label="Event key">
            <input
              type="text"
              placeholder="e.g. assignment_posted"
              value={form.eventKey}
              onChange={(e) => setForm((f) => ({ ...f, eventKey: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Title template">
            <input
              type="text"
              placeholder="Title template"
              value={form.titleTemplate}
              onChange={(e) => setForm((f) => ({ ...f, titleTemplate: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Body template">
            <textarea
              rows={3}
              placeholder="Body template"
              value={form.bodyTemplate}
              onChange={(e) => setForm((f) => ({ ...f, bodyTemplate: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.inAppEnabled}
              onChange={(e) => setForm((f) => ({ ...f, inAppEnabled: e.target.checked }))}
            />
            <span>In-app enabled</span>
          </label>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(e) => setForm((f) => ({ ...f, emailEnabled: e.target.checked }))}
            />
            <span>Email enabled</span>
          </label>
          <div className="admin-action-group" style={{ marginTop: '1rem' }}>
            <AdminButton type="submit" variant="primary">
              {editingId ? 'Update' : 'Save'}
            </AdminButton>
            {editingId && (
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Templates">
        {templates.length === 0 ? (
          <AdminEmptyState message="No templates yet." description="Create a template above." />
        ) : (
          <ul className="admin-list">
            {templates.map((t) => (
              <li key={t.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{t.event_key}</p>
                  <div className="admin-action-group">
                    <button type="button" onClick={() => handleEdit(t)} className="admin-link admin-link-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(t.id)} className="admin-link admin-link-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  In-app: {t.in_app_enabled !== false ? 'On' : 'Off'} · Email: {t.email_enabled !== false ? 'On' : 'Off'}
                </p>
                {t.title_template && <p className="admin-list-item-body">Title: {t.title_template}</p>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
