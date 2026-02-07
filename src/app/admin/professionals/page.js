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
  name: '',
  title: '',
  company: '',
  bio: '',
  photoUrl: '',
  linkedinUrl: '',
  trackId: '',
  isActive: true,
};

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

export default function AdminProfessionalsPage() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadData = async () => {
    const [profRes, trackRes] = await Promise.all([
      fetch('/api/admin/industry-professionals', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
    ]);
    const profData = await profRes.json();
    const trackData = await trackRes.json();
    if (profRes.ok && profData.professionals) setProfessionals(profData.professionals);
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
    if (!form.name.trim()) return;
    const endpoint = editingId ? `/api/admin/industry-professionals/${editingId}` : '/api/admin/industry-professionals';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage(editingId ? 'Professional updated.' : 'Professional created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to save professional');
    }
  };

  const handleEdit = (person) => {
    setEditingId(person.id);
    setForm({
      name: person.name || '',
      title: person.title || '',
      company: person.company || '',
      bio: person.bio || '',
      photoUrl: person.photo_url || '',
      linkedinUrl: person.linkedin_url || '',
      trackId: person.track_id || '',
      isActive: person.is_active !== false,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/industry-professionals/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Industry Professionals"
        description="Manage mentor and advisor profiles shown on the platform."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title={editingId ? 'Edit profile' : 'Add professional'}>
        <form onSubmit={handleSubmit} className="admin-form-section">
          <AdminFormField label="Name">
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="Title">
              <input
                type="text"
                placeholder="Job title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="Company">
              <input
                type="text"
                placeholder="Company name"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
          </div>
          <AdminFormField label="Bio">
            <textarea
              rows={4}
              placeholder="Short bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="Photo URL">
              <input
                type="text"
                placeholder="https://..."
                value={form.photoUrl}
                onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="LinkedIn URL">
              <input
                type="text"
                placeholder="https://linkedin.com/..."
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
          </div>
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

      <AdminCard title="Profiles">
        {professionals.length === 0 ? (
          <AdminEmptyState message="No professionals yet." description="Add a professional above." />
        ) : (
          <ul className="admin-list">
            {professionals.map((person) => (
              <li key={person.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{person.name}</p>
                  <div className="admin-action-group">
                    <button type="button" onClick={() => handleEdit(person)} className="admin-link admin-link-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(person.id)} className="admin-link admin-link-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  {person.title || 'Role'} · {person.company || 'Company'}
                  {person.track_name ? ` · ${person.track_name}` : ''}
                  {!person.is_active ? ' · Inactive' : ''}
                </p>
                {person.bio && <p className="admin-list-item-body">{person.bio}</p>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
