'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ trackId: '', name: '', startDate: '', endDate: '', status: 'upcoming' });
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadCohorts();
    loadTracks();
  }, [router]);

  const loadCohorts = async () => {
    try {
      const res = await fetch('/api/cohorts', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.cohorts) setCohorts(data.cohorts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async () => {
    try {
      const res = await fetch('/api/tracks');
      const data = await res.json();
      if (res.ok && data.tracks) setTracks(data.tracks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!form.trackId || !form.name?.trim() || !form.startDate || !form.endDate) return;
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          trackId: parseInt(form.trackId, 10),
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.cohort) {
        setCohorts((prev) => [data.cohort, ...prev]);
        setShowCreate(false);
        setForm({ trackId: '', name: '', startDate: '', endDate: '', status: 'upcoming' });
      } else {
        alert(data.error || 'Failed to create cohort');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create cohort');
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 className="admin-page-title" style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Cohorts</h1>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {showCreate ? 'Cancel' : 'Create cohort'}
          </button>
        </div>

        {showCreate && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>New cohort</h2>
            <form onSubmit={handleCreateCohort} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <label>
                Track
                <select
                  required
                  value={form.trackId}
                  onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid #e1e4e8' }}
                >
                  <option value="">Select track</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>{t.track_name}</option>
                  ))}
                </select>
              </label>
              <label>
                Name
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Data Science Cohort 5"
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid #e1e4e8' }}
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid #e1e4e8' }}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid #e1e4e8' }}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid #e1e4e8' }}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#00c896', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Create
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#666' }}>Loading cohorts...</p>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {cohorts.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No cohorts yet. Create one above.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e4e8', backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Track</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Start</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>End</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>{c.name}</td>
                      <td style={{ padding: '1rem' }}>{c.track_name}</td>
                      <td style={{ padding: '1rem' }}>{formatDate(c.start_date)}</td>
                      <td style={{ padding: '1rem' }}>{formatDate(c.end_date)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: c.status === 'active' ? '#d4edda' : c.status === 'completed' ? '#e2e3e5' : '#fff3cd',
                          color: c.status === 'active' ? '#155724' : c.status === 'completed' ? '#383d41' : '#856404',
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/admin/cohorts/${c.id}`} style={{ color: '#0066cc', fontWeight: '600', textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
  );
}
