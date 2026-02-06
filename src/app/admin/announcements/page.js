'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
      setMessage(editingId ? 'Announcement updated.' : 'Announcement created.');
      setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', sendEmail: true, publishAt: '' });
      setEditingId(null);
      await loadData();
    } else {
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

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create announcement</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Message"
              rows={4}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <label className="block text-sm text-gray-700">
              Publish at (optional)
              <input
                type="datetime-local"
                value={form.publishAt}
                onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="system">System-wide</option>
              <option value="track">Track</option>
              <option value="cohort">Cohort</option>
            </select>
            {form.scope === 'track' && (
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select track</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            )}
            {form.scope === 'cohort' && (
              <select
                value={form.cohortId}
                onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {!editingId && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={(e) => setForm((f) => ({ ...f, sendEmail: e.target.checked }))}
                />
                Send email notification (Resend)
              </label>
            )}
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
              {editingId ? 'Update' : 'Publish'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ title: '', body: '', scope: 'system', trackId: '', cohortId: '', sendEmail: true, publishAt: '' });
                }}
                className="ml-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <div className="flex gap-3">
                      {!a.is_published && (
                        <button
                          type="button"
                          onClick={() => handlePublishNow(a)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Publish now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.is_published ? 'Published' : 'Scheduled'} {a.publish_at ? `· ${new Date(a.publish_at).toLocaleString()}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}
