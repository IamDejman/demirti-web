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
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminPageHeader
          title="Notification Templates"
          description="Edit notification templates for events. Toggle in-app and email delivery per template."
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

        {/* Form card */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            marginTop: 0,
          }}>{editingId ? 'Edit template' : 'Create template'}</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Event key</label>
                <input
                  type="text"
                  placeholder="e.g. assignment_posted"
                  value={form.eventKey}
                  onChange={(e) => setForm((f) => ({ ...f, eventKey: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Title template</label>
                <input
                  type="text"
                  placeholder="Title template"
                  value={form.titleTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, titleTemplate: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Body template</label>
                <textarea
                  rows={3}
                  placeholder="Body template"
                  value={form.bodyTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, bodyTemplate: e.target.value }))}
                  style={{ ...INPUT_STYLE, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                  <input
                    type="checkbox"
                    checked={form.inAppEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, inAppEnabled: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  In-app enabled
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                  <input
                    type="checkbox"
                    checked={form.emailEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, emailEnabled: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  Email enabled
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
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
                  {editingId ? 'Update' : 'Save'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '0.625rem 1.5rem',
                      background: '#f3f4f6',
                      color: 'var(--text-color)',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Templates list */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            marginTop: 0,
          }}>Templates</h3>

          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.25rem' }}>No templates yet</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Create a template above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {templates.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem', flex: '1 1 auto' }}>
                      {t.event_key}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--primary-color, #0052a3)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', fontSize: '0.8125rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: t.in_app_enabled !== false ? 'rgba(5, 150, 105, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: t.in_app_enabled !== false ? '#059669' : '#6b7280',
                    }}>
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: t.in_app_enabled !== false ? '#059669' : '#6b7280',
                      }} />
                      In-app {t.in_app_enabled !== false ? 'On' : 'Off'}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: t.email_enabled !== false ? 'rgba(5, 150, 105, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: t.email_enabled !== false ? '#059669' : '#6b7280',
                    }}>
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: t.email_enabled !== false ? '#059669' : '#6b7280',
                      }} />
                      Email {t.email_enabled !== false ? 'On' : 'Off'}
                    </span>
                  </div>
                  {t.title_template && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.375rem' }}>
                      Title: {t.title_template}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
