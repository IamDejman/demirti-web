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
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminPageHeader
          title="Sample Projects"
          description="Manage example projects showcased to students."
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
          }}>{editingId ? 'Edit project' : 'Create project'}</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Title</label>
                <input
                  type="text"
                  placeholder="Project title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Description</label>
                <textarea
                  rows={4}
                  placeholder="Project description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ ...INPUT_STYLE, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={LABEL_STYLE}>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="tag1, tag2"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Track</label>
                  <select
                    value={form.trackId}
                    onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                    style={INPUT_STYLE}
                  >
                    <option value="">All tracks</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.track_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={LABEL_STYLE}>Thumbnail URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>External URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.externalUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                Active
              </label>

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
                  {editingId ? 'Update' : 'Publish'}
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

        {/* Projects list */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            marginTop: 0,
          }}>Projects</h3>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.25rem' }}>No projects yet</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Create a project above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>
                        {project.title}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>
                        {project.track_name ? `${project.track_name}` : 'All tracks'}
                      </div>
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
                      background: project.is_active ? 'rgba(5, 150, 105, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: project.is_active ? '#059669' : '#6b7280',
                    }}>
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: project.is_active ? '#059669' : '#6b7280',
                      }} />
                      {project.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(project)}
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
                        onClick={() => handleDelete(project.id)}
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
                  {project.description && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                      {project.description}
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
