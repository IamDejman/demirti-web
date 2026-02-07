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
  title: '',
  description: '',
  trackId: '',
  tags: '',
  thumbnailUrl: '',
  externalUrl: '',
  isActive: true,
};

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

export default function AdminSampleProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

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
      setMessageType('success');
      setMessage(editingId ? 'Project updated.' : 'Project created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessageType('error');
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

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Sample Projects"
        description="Manage example projects showcased to students."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title={editingId ? 'Edit project' : 'Create project'}>
        <form onSubmit={handleSubmit} className="admin-form-section">
          <AdminFormField label="Title">
            <input
              type="text"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Description">
            <textarea
              rows={4}
              placeholder="Project description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="Tags (comma separated)">
              <input
                type="text"
                placeholder="tag1, tag2"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="Track">
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className={inputClass}
              >
                <option value="">All tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </AdminFormField>
          </div>
          <div className="admin-form-grid">
            <AdminFormField label="Thumbnail URL">
              <input
                type="text"
                placeholder="https://..."
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="External URL">
              <input
                type="text"
                placeholder="https://..."
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
          </div>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Active</span>
          </label>
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

      <AdminCard title="Projects">
        {projects.length === 0 ? (
          <AdminEmptyState message="No projects yet." description="Create a project above." />
        ) : (
          <ul className="admin-list">
            {projects.map((project) => (
              <li key={project.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{project.title}</p>
                  <div className="admin-action-group">
                    <button type="button" onClick={() => handleEdit(project)} className="admin-link admin-link-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(project.id)} className="admin-link admin-link-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  {project.track_name ? `${project.track_name} · ` : ''}
                  {project.is_active ? 'Active' : 'Inactive'}
                </p>
                {project.description && <p className="admin-list-item-body">{project.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
