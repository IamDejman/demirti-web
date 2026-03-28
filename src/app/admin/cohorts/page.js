'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader, AdminButton } from '../../components/admin';
import { useToast } from '../../components/ToastProvider';

import { getAuthHeaders } from '@/lib/authClient';
import { formatDateLagos } from '@/lib/dateUtils';

const STATUS_CONFIG = {
  active: { label: 'Active', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', dot: '#10b981' },
  upcoming: { label: 'Upcoming', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', dot: '#6366f1' },
  completed: { label: 'Completed', bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#9ca3af' },
};

export default function AdminCohortsPage() {
  const { showToast } = useToast();
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
        showToast({ type: 'error', message: data.error || 'Failed to create cohort' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to create cohort' });
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete cohort "${c.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/cohorts/${c.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.deleted) {
        setCohorts((prev) => prev.filter((x) => x.id !== c.id));
      } else {
        showToast({ type: 'error', message: data.error || 'Failed to delete cohort' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to delete cohort' });
    }
  };

  const formatDate = (d) => (d ? formatDateLagos(d) : 'N/A');

  const activeCohorts = cohorts.filter((c) => c.status === 'active').length;
  const upcomingCohorts = cohorts.filter((c) => c.status === 'upcoming').length;
  const completedCohorts = cohorts.filter((c) => c.status === 'completed').length;

  return (
    <div className="admin-dashboard admin-dashboard-content admin-cohorts-wrap">
      <AdminPageHeader
        title="Cohorts"
        description="Manage learning cohorts and their schedules."
        actions={
          <AdminButton variant={showCreate ? 'secondary' : 'primary'} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ Create cohort'}
          </AdminButton>
        }
      />

      {/* Stats overview */}
      {!loading && cohorts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: cohorts.length, accent: 'var(--primary-color)' },
            { label: 'Active', value: activeCohorts, accent: '#10b981' },
            { label: 'Upcoming', value: upcomingCohorts, accent: '#6366f1' },
            { label: 'Completed', value: completedCohorts, accent: '#9ca3af' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-xl, 16px)',
                padding: '1.25rem 1.5rem',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderTop: `3px solid ${stat.accent}`,
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--primary-color, #0052a3)' }}>
          <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary-color), #1e88e5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.875rem' }}>+</span>
            New cohort
          </h2>
          <form onSubmit={handleCreateCohort} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Track</label>
              <select required className="admin-form-input" value={form.trackId} onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}>
                <option value="">Select track</option>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.track_name}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Cohort name</label>
              <input type="text" required className="admin-form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Data Science Cohort 5" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Start date</label>
              <input type="date" required className="admin-form-input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">End date</label>
              <input type="date" required className="admin-form-input" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <select className="admin-form-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <AdminButton type="submit" variant="primary">Create cohort</AdminButton>
            </div>
          </form>
        </div>
      )}

      {/* Cohorts list */}
      {loading ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--neutral-500)', fontSize: '0.9375rem' }}>Loading cohorts...</p>
        </div>
      ) : cohorts.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-50, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px dashed var(--primary-200, #bfdbfe)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>No cohorts yet</h3>
          <p style={{ color: 'var(--neutral-500)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>Create your first cohort to start managing students.</p>
          <AdminButton variant="primary" onClick={() => setShowCreate(true)}>+ Create cohort</AdminButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cohorts.map((c) => {
            const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.upcoming;
            const startDate = c.start_date ? new Date(c.start_date) : null;
            const endDate = c.end_date ? new Date(c.end_date) : null;
            const now = new Date();
            let progressPct = 0;
            if (startDate && endDate && now >= startDate) {
              const total = endDate - startDate;
              const elapsed = Math.min(now - startDate, total);
              progressPct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
            }

            return (
              <div
                key={c.id}
                className="admin-card"
                style={{
                  marginBottom: 0,
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'box-shadow 250ms ease, transform 250ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                {/* Top progress bar */}
                {c.status === 'active' && (
                  <div style={{ height: 3, background: 'var(--neutral-100)', width: '100%' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--primary-color), #10b981)', borderRadius: '0 2px 2px 0', transition: 'width 500ms ease' }} />
                  </div>
                )}

                <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  {/* Left: info */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0 }}>
                    {/* Cohort icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: c.status === 'active' ? 'linear-gradient(135deg, var(--primary-color), #1e88e5)' : c.status === 'completed' ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                      color: c.status === 'completed' ? '#9ca3af' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: c.status === 'completed' ? 'none' : `0 2px 8px ${c.status === 'active' ? 'rgba(0,82,163,0.25)' : 'rgba(99,102,241,0.25)'}`,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                        <Link href={`/admin/cohorts/${c.id}`} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-900)', textDecoration: 'none' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--neutral-900)'}
                        >
                          {c.name}
                        </Link>
                        {/* Status badge */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
                          background: status.bg, color: status.color, border: `1.5px solid ${status.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                          {status.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                        {c.track_name && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            {c.track_name}
                          </span>
                        )}
                        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {formatDate(c.start_date)} &ndash; {formatDate(c.end_date)}
                        </span>
                        {c.status === 'active' && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                            Week {c.current_week ?? 1} &middot; {progressPct}% complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <Link href={`/admin/cohorts/${c.id}`} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>
                      Manage
                    </Link>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ color: 'var(--neutral-400)' }}
                      onClick={() => handleDelete(c)}
                      title="Delete cohort"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
