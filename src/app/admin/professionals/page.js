'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminProfessionalsPage() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

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
      setMessage(editingId ? 'Professional updated.' : 'Professional created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
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

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Industry Professionals</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit profile' : 'Add professional'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Photo URL"
                value={form.photoUrl}
                onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profiles</h2>
          {professionals.length === 0 ? (
            <p className="text-sm text-gray-500">No professionals yet.</p>
          ) : (
            <ul className="space-y-3">
              {professionals.map((person) => (
                <li key={person.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(person)} className="text-xs text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => handleDelete(person.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {person.title || 'Role'} · {person.company || 'Company'} {person.track_name ? `· ${person.track_name}` : ''} {person.is_active ? '' : '· Inactive'}
                  </p>
                  {person.bio && <p className="text-sm text-gray-500 mt-1">{person.bio}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
}
