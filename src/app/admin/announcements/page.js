'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminButton } from '../../components/admin';
import { getAuthHeaders } from '@/lib/authClient';

const STATUS_CONFIG = {
  published: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Published' },
  scheduled: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Scheduled' },
};

function StatusBadge({ published }) {
  const config = published ? STATUS_CONFIG.published : STATUS_CONFIG.scheduled;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.375rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: '0.875rem',
  outline: 'none',
  background: '#fff',
};

const cardStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #e5e7eb',
  fontWeight: 600,
  fontSize: '0.9375rem',
  color: '#111827',
};

const cardBodyStyle = {
  padding: '1.25rem',
};

const rowStyle = {
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: '0.875rem 1rem',
  marginBottom: '0.625rem',
};

const metaTextStyle = {
  fontSize: '0.8125rem',
  color: '#6b7280',
  margin: 0,
  lineHeight: 1.5,
};

const smallBtnBase = {
  padding: '0.3rem 0.625rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid',
  cursor: 'pointer',
  background: 'transparent',
};

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    scope: 'system',
    trackId: '',
    cohortId: '',
    audience: 'all',
    sendEmail: true,
    publishAt: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadData = async () => {
    const [annRes, trackRes, cohortRes] = await Promise.all([
      fetch('/api/admin/announcements', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
      fetch('/api/cohorts', { headers: getAuthHeaders() }),
    ]);
    const annData = await annRes.json();
    const trackData = await trackRes.json();
    const cohortData = await cohortRes.json();
    if (annRes.ok && annData.announcements) setAnnouncements(annData.announcements);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.title.trim() || !form.body.trim()) return;
    const endpoint = editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        title: form.title.trim(),
        body: form.body.trim(),
        scope: form.scope,
        trackId: form.scope === 'track' ? parseInt(form.trackId, 10) : null,
        cohortId: form.scope === 'cohort' ? form.cohortId : null,
        audience: form.scope !== 'system' ? form.audience : 'all',
        sendEmail: form.sendEmail,
        publishAt: form.publishAt || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.announcement) {
      setMessageType('success');
      setMessage(editingId ? 'Announcement updated.' : 'Announcement created.');
      setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', audience: 'all', sendEmail: true, publishAt: '' });
      setEditingId(null);
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  const handlePublishNow = async (announcement) => {
    await fetch(`/api/admin/announcements/${announcement.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ publishNow: true }),
    });
    await loadData();
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title || '',
      body: announcement.body || '',
      scope: announcement.scope || 'system',
      trackId: announcement.track_id || '',
      cohortId: announcement.cohort_id || '',
      audience: announcement.audience || 'all',
      sendEmail: announcement.send_email !== false,
      publishAt: announcement.publish_at ? new Date(announcement.publish_at).toISOString().slice(0, 16) : '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', audience: 'all', sendEmail: true, publishAt: '' });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
      <AdminPageHeader title="Announcements" description="Create and manage LMS announcements for students." />

      {message && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            border: `1px solid ${messageType === 'success' ? '#059669' : '#dc2626'}30`,
            backgroundColor: messageType === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            color: messageType === 'success' ? '#059669' : '#dc2626',
          }}
        >
          {message}
        </div>
      )}

      {/* Form Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <div style={cardHeaderStyle}>
          {editingId ? 'Edit Announcement' : 'Create Announcement'}
        </div>
        <div style={cardBodyStyle}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  placeholder="Announcement content"
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Publish at (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Scope</label>
                  <select
                    value={form.scope}
                    onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="system">System-wide</option>
                    <option value="track">Track</option>
                    <option value="cohort">Cohort</option>
                  </select>
                </div>
              </div>

              {form.scope === 'track' && (
                <div>
                  <label style={labelStyle}>Track</label>
                  <select
                    value={form.trackId}
                    onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select track</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.track_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === 'cohort' && (
                <div>
                  <label style={labelStyle}>Cohort</label>
                  <select
                    value={form.cohortId}
                    onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select cohort</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope !== 'system' && (
                <div>
                  <label style={labelStyle}>Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="all">Everyone (participants & facilitators)</option>
                    <option value="participants">Participants only</option>
                    <option value="facilitators">Facilitators only</option>
                  </select>
                </div>
              )}

              {!editingId && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => setForm((f) => ({ ...f, sendEmail: e.target.checked }))}
                    style={{ accentColor: '#059669' }}
                  />
                  Send email notification (Resend)
                </label>
              )}

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                <AdminButton type="submit" variant="primary">
                  {editingId ? 'Update' : 'Publish'}
                </AdminButton>
                {editingId && (
                  <AdminButton type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </AdminButton>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Announcements List Card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          Recent Announcements
        </div>
        <div style={cardBodyStyle}>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500, margin: '0 0 0.375rem' }}>No announcements yet</p>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>Create your first announcement above.</p>
            </div>
          ) : (
            <div>
              {announcements.map((a) => (
                <div key={a.id} style={rowStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
                          {a.title}
                        </span>
                        <StatusBadge published={a.is_published} />
                      </div>
                      <p style={{ ...metaTextStyle, marginBottom: '0.375rem' }}>
                        {a.scope === 'system' ? 'System-wide' : a.scope === 'track' ? 'Track' : 'Cohort'}
                        {a.publish_at && ` \u00B7 ${new Date(a.publish_at).toLocaleString()}`}
                        {a.audience && a.audience !== 'all' && ` \u00B7 ${a.audience === 'participants' ? 'Participants only' : 'Facilitators only'}`}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                        {a.body}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      {!a.is_published && (
                        <button
                          type="button"
                          onClick={() => handlePublishNow(a)}
                          style={{
                            ...smallBtnBase,
                            borderColor: '#05966930',
                            color: '#059669',
                          }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(5,150,105,0.06)'; }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                        >
                          Publish now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        style={{
                          ...smallBtnBase,
                          borderColor: '#2563eb30',
                          color: '#2563eb',
                        }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(37,99,235,0.06)'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        style={{
                          ...smallBtnBase,
                          borderColor: '#dc262630',
                          color: '#dc2626',
                        }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(220,38,38,0.06)'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                      >
                        Delete
                      </button>
                    </div>
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
