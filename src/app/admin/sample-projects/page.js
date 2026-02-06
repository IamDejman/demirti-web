'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const emptyForm = {
  title: '',
  description: '',
  trackId: '',
  tags: '',
  thumbnailUrl: '',
  externalUrl: '',
  isActive: true,
};

export default function AdminSampleProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [projRes, trackRes] = await Promise.all([
      fetch('/api/admin/sample-projects', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
    ]);
    const projData = await projRes.json();
    const trackData = await trackRes.json();
    if (projRes.ok && projData.projects) setProjects(projData.projects);
    if (trackRes.ok && trackData.tracks) setTracks(trackData.tracks);
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
    if (!form.title.trim()) return;
    const endpoint = editingId ? `/api/admin/sample-projects/${editingId}` : '/api/admin/sample-projects';
    const method = editingId ? 'PUT' : 'POST';
    const payload = { ...form, tags: form.tags };
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(editingId ? 'Project updated.' : 'Project created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessage(data.error || 'Failed to save project');
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setForm({
      title: project.title || '',
      description: project.description || '',
      trackId: project.track_id || '',
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
      thumbnailUrl: project.thumbnail_url || '',
      externalUrl: project.external_url || '',
      isActive: project.is_active !== false,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/sample-projects/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Sample Projects</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit project' : 'Create project'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              rows={4}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Thumbnail URL"
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="External URL"
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
              {editingId ? 'Update' : 'Publish'}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(project)} className="text-xs text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => handleDelete(project.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.track_name ? `${project.track_name} · ` : ''}{project.is_active ? 'Active' : 'Inactive'}
                  </p>
                  {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
}
