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

const emptyForm = { name: '', trackId: '', cohortId: '' };

export default function AdminCourseTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [applyTarget, setApplyTarget] = useState({});

  const loadData = async () => {
    const [templateRes, trackRes, cohortRes] = await Promise.all([
      fetch('/api/admin/course-templates', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
      fetch('/api/cohorts', { headers: getAuthHeaders() }),
    ]);
    const templateData = await templateRes.json();
    const trackData = await trackRes.json();
    const cohortData = await cohortRes.json();
    if (templateRes.ok && templateData.templates) setTemplates(templateData.templates);
    if (trackRes.ok && trackData.tracks) setTracks(trackData.tracks);
    if (cohortRes.ok && cohortData.cohorts) setCohorts(cohortData.cohorts);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.name.trim()) return;
    const res = await fetch('/api/admin/course-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage('Template created.');
      setForm(emptyForm);
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to create template');
    }
  };

  const handleApply = async (templateId) => {
    const cohortId = applyTarget[templateId];
    if (!cohortId) return;
    await fetch(`/api/admin/course-templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ cohortId }),
    });
    setMessageType('success');
    setMessage('Template applied.');
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminPageHeader
          title="Course Templates"
          description="Create templates and apply them to cohorts to structure course content."
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

        {/* Create template form */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}>Create template</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Template name</label>
                <input
                  type="text"
                  placeholder="Template name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={LABEL_STYLE}>Optional track</label>
                  <select
                    value={form.trackId}
                    onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                    style={INPUT_STYLE}
                  >
                    <option value="">Select track</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.track_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Copy from cohort (optional)</label>
                  <select
                    value={form.cohortId}
                    onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                    style={INPUT_STYLE}
                  >
                    <option value="">Select cohort</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
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
                  Create template
                </button>
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem', flex: '1 1 auto' }}>
                      {t.name}
                    </div>
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
                      background: t.track_id ? 'rgba(37, 99, 235, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: t.track_id ? '#2563eb' : '#6b7280',
                    }}>
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: t.track_id ? '#2563eb' : '#6b7280',
                      }} />
                      {t.track_id ? 'Track template' : 'General'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={applyTarget[t.id] || ''}
                      onChange={(e) => setApplyTarget((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      style={{ ...INPUT_STYLE, width: 'auto', minWidth: 180, flex: '1 1 auto' }}
                    >
                      <option value="">Apply to cohort</option>
                      {cohorts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleApply(t.id)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: 'var(--primary-color, #0052a3)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
