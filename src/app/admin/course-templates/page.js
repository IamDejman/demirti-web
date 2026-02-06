'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const emptyForm = { name: '', trackId: '', cohortId: '' };

export default function AdminCourseTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
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
      setMessage('Template created.');
      setForm(emptyForm);
      await loadData();
    } else {
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
    setMessage('Template applied.');
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Course Templates</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create template</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Optional track</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
              <select
                value={form.cohortId}
                onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Copy from cohort (optional)</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
              Create template
            </button>
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
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <span className="text-xs text-gray-500">{t.track_id ? 'Track template' : 'General'}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <select
                      value={applyTarget[t.id] || ''}
                      onChange={(e) => setApplyTarget((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Apply to cohort</option>
                      {cohorts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleApply(t.id)} className="px-3 py-2 bg-primary text-white text-sm rounded-lg">
                      Apply
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
}
