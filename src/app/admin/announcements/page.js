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

import { getAuthHeaders } from '@/lib/authClient';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

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
        sendEmail: form.sendEmail,
        publishAt: form.publishAt || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.announcement) {
      setMessageType('success');
      setMessage(editingId ? 'Announcement updated.' : 'Announcement created.');
      setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', sendEmail: true, publishAt: '' });
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
      sendEmail: announcement.send_email !== false,
      publishAt: announcement.publish_at ? new Date(announcement.publish_at).toISOString().slice(0, 16) : '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', sendEmail: true, publishAt: '' });
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader title="Announcements" description="Create and manage LMS announcements for students." />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title={editingId ? 'Edit announcement' : 'Create announcement'}>
        <form onSubmit={handleSubmit} className="admin-form-section">
          <AdminFormField label="Title">
            <input
              type="text"
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Message">
            <textarea
              placeholder="Announcement content"
              rows={4}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Publish at (optional)">
            <input
              type="datetime-local"
              value={form.publishAt}
              onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Scope">
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              className={inputClass}
            >
              <option value="system">System-wide</option>
              <option value="track">Track</option>
              <option value="cohort">Cohort</option>
            </select>
          </AdminFormField>
          {form.scope === 'track' && (
            <AdminFormField label="Track">
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select track</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </AdminFormField>
          )}
          {form.scope === 'cohort' && (
            <AdminFormField label="Cohort">
              <select
                value={form.cohortId}
                onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </AdminFormField>
          )}
          {!editingId && (
            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={(e) => setForm((f) => ({ ...f, sendEmail: e.target.checked }))}
              />
              <span>Send email notification (Resend)</span>
            </label>
          )}
          <div className="admin-action-group" style={{ marginTop: '1rem' }}>
            <AdminButton type="submit" variant="primary">
              {editingId ? 'Update' : 'Publish'}
            </AdminButton>
            {editingId && (
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Recent announcements">
        {announcements.length === 0 ? (
          <AdminEmptyState message="No announcements yet." description="Create your first announcement above." />
        ) : (
          <ul className="admin-list">
            {announcements.map((a) => (
              <li key={a.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{a.title}</p>
                  <div className="admin-action-group">
                    {!a.is_published && (
                      <button
                        type="button"
                        onClick={() => handlePublishNow(a)}
                        className="admin-link admin-link-success"
                      >
                        Publish now
                      </button>
                    )}
                    <button type="button" onClick={() => handleEdit(a)} className="admin-link admin-link-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(a.id)} className="admin-link admin-link-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  {a.is_published ? 'Published' : 'Scheduled'}
                  {a.publish_at && ` · ${new Date(a.publish_at).toLocaleString()}`}
                </p>
                <p className="admin-list-item-body">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
