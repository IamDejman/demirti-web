'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader, AdminButton } from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';
import { formatDateLagos } from '@/lib/dateUtils';

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
    loadInitial();
  }, [router]);

  const loadInitial = async () => {
    try {
      const [cohortsRes, tracksRes] = await Promise.all([
        fetch('/api/cohorts', { headers: getAuthHeaders() }),
        fetch('/api/track-config'),
      ]);
      const [cohortsData, tracksData] = await Promise.all([cohortsRes.json(), tracksRes.json()]);
      if (cohortsRes.ok && cohortsData.cohorts) setCohorts(cohortsData.cohorts);
      if (tracksRes.ok && tracksData.tracks) setTracks(tracksData.tracks);
    } catch {
    } finally {
      setLoading(false);
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
    } catch {
      alert('Failed to create cohort');
    }
  };

  const formatDate = (d) => (d ? formatDateLagos(d) : 'N/A');

  return (
    <div className="admin-dashboard admin-dashboard-content admin-cohorts-wrap">
        <AdminPageHeader
          title="Cohorts"
          description="Manage learning cohorts and their schedules."
          actions={
            <AdminButton variant={showCreate ? 'secondary' : 'primary'} onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? 'Cancel' : 'Create cohort'}
            </AdminButton>
          }
        />

        {showCreate && (
          <div className="admin-card">
            <h2 className="admin-card-title">New cohort</h2>
            <form onSubmit={handleCreateCohort} className="admin-form-create">
              <div className="admin-form-group">
                <label>Track</label>
                <select
                  required
                  className="admin-form-input"
                  value={form.trackId}
                  onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                >
                  <option value="">Select track</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>{t.track_name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Name</label>
                <input
                  type="text"
                  required
                  className="admin-form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Data Science Cohort 5"
                />
              </div>
              <div className="admin-form-group">
                <label>Start date</label>
                <input
                  type="date"
                  required
                  className="admin-form-input"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <label>End date</label>
                <input
                  type="date"
                  required
                  className="admin-form-input"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-form-input"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <AdminButton type="submit" variant="primary">Create</AdminButton>
            </form>
          </div>
        )}

        {loading ? (
          <p className="admin-loading">Loading cohorts...</p>
        ) : (
          <div className="admin-card admin-card-last">
            {cohorts.length === 0 ? (
              <p className="admin-empty-state">No cohorts yet. Create one above.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr className="admin-table-thead-row">
                    <th className="admin-table-th">Name</th>
                    <th className="admin-table-th">Track</th>
                    <th className="admin-table-th">Start</th>
                    <th className="admin-table-th">End</th>
                    <th className="admin-table-th">Status</th>
                    <th className="admin-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.id} className="admin-table-tr">
                      <td className="admin-table-td">{c.name}</td>
                      <td className="admin-table-td">{c.track_name}</td>
                      <td className="admin-table-td">{formatDate(c.start_date)}</td>
                      <td className="admin-table-td">{formatDate(c.end_date)}</td>
                      <td className="admin-table-td">
                        <span className={c.status === 'active' ? 'admin-badge-status-success' : c.status === 'completed' ? 'admin-badge-status-neutral' : 'admin-badge-status-warning'}>
                          {c.status}
                        </span>
                      </td>
                      <td className="admin-table-td">
                        <span className="admin-action-group">
                          <Link href={`/admin/cohorts/${c.id}`} className="admin-link-view">
                            View
                          </Link>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={async () => {
                              if (!confirm(`Delete cohort "${c.name}"? This cannot be undone.`)) return;
                              try {
                                const res = await fetch(`/api/cohorts/${c.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                                const data = await res.json();
                                if (res.ok && data.deleted) {
                                  setCohorts((prev) => prev.filter((x) => x.id !== c.id));
                                } else {
                                  alert(data.error || 'Failed to delete cohort');
                                }
                              } catch {
                                alert('Failed to delete cohort');
                              }
                            }}
                          >
                            Delete
                          </button>
                        </span>
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
