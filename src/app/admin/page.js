'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminButton } from '../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

function escapeCsvCell(s) {
  if (s == null) return '';
  const str = String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function appToCsvRow(app) {
  const amountNaira = app.amount ? (Number(app.amount) / 100).toFixed(2) : '';
  return [
    app.application_id ?? app.id,
    app.first_name,
    app.last_name,
    app.email,
    app.phone,
    app.track_name,
    app.referral_source || '',
    app.status,
    amountNaira,
    app.payment_reference || '',
    app.discount_code || '',
    app.created_at ? new Date(app.created_at).toISOString() : '',
    app.paid_at ? new Date(app.paid_at).toISOString() : ''
  ].map(escapeCsvCell).join(',');
}

const APPLICATIONS_CSV_HEADER = 'Application ID,First Name,Last Name,Email,Phone,Track,Referral Source,Status,Amount (₦),Payment Reference,Discount Code,Applied At,Paid At\n';

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const STAT_COLORS = {
  primary: { border: '#0052a3', bg: 'rgba(0, 82, 163, 0.06)' },
  success: { border: '#059669', bg: 'rgba(5, 150, 105, 0.06)' },
  warning: { border: '#d97706', bg: 'rgba(217, 119, 6, 0.06)' },
  revenue: { border: '#7c3aed', bg: 'rgba(124, 58, 237, 0.06)' },
};

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const pendingApps = applications.filter((a) => a.status !== 'paid');

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingApps.length && pendingApps.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingApps.map((a) => a.id)));
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [selectedTrack, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const trackParam = selectedTrack !== 'all' ? `&track=${encodeURIComponent(selectedTrack)}` : '';
      const statusParam = selectedStatus !== 'all' ? `&status=${selectedStatus}` : '';
      const appsResponse = await fetch(`/api/admin/applications?${trackParam}${statusParam}`, {
        headers: getAuthHeaders(),
      });
      const appsData = await appsResponse.json();

      if (appsData.success) {
        setApplications(appsData.applications);
        setStats(appsData.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const getUniqueTracks = () => {
    const tracks = new Set(applications.map(app => app.track_name));
    return Array.from(tracks);
  };

  const exportCsv = () => {
    const rows = applications.map(app => appToCsvRow(app)).join('\n');
    const trackSuffix = selectedTrack !== 'all' ? `-${selectedTrack.replace(/\s+/g, '-')}` : '';
    const statusSuffix = selectedStatus !== 'all' ? `-${selectedStatus}` : '';
    const filename = `applications${trackSuffix}${statusSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(APPLICATIONS_CSV_HEADER + rows, filename);
  };

  const promptDeleteSingle = (app) => {
    setDeleteTarget({ id: app.id, name: `${app.first_name} ${app.last_name}` });
    setShowDeleteConfirm(true);
  };

  const promptDeleteBulk = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const body = deleteTarget
        ? { id: deleteTarget.id }
        : { ids: Array.from(selectedIds) };

      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds(new Set());
        setExpandedId(null);
        await loadData();
      }
    } catch {
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="admin-dashboard admin-dashboard-content">
      <div className="container admin-cohorts-wrap">
        <AdminPageHeader
          title="Applications"
          description="View and manage bootcamp applications, payments, and revenue."
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            <p style={{ fontSize: '0.9375rem' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Applications', value: stats.total, accent: 'primary' },
                  { label: 'Paid', value: stats.paid, accent: 'success' },
                  { label: 'Pending Payment', value: stats.pending, accent: 'warning' },
                  { label: 'Total Revenue', value: `₦${stats.totalRevenue ? (stats.totalRevenue / 100).toLocaleString() : '0'}`, accent: 'revenue' },
                ].map((stat, i) => {
                  const colors = STAT_COLORS[stat.accent];
                  return (
                    <div key={i} style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '1.25rem',
                      border: '1px solid #e5e7eb',
                      borderTop: `3px solid ${colors.border}`,
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filters */}
            <div className="admin-card" style={{ borderRadius: 12, marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="admin-form-input"
                  style={{ minWidth: 160 }}
                >
                  <option value="all">All Tracks</option>
                  {getUniqueTracks().map(track => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="admin-form-input"
                  style={{ minWidth: 140 }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>

                <AdminButton variant="primary" onClick={loadData}>
                  Refresh
                </AdminButton>

                <AdminButton
                  variant="secondary"
                  onClick={exportCsv}
                  disabled={applications.length === 0}
                >
                  Export CSV
                </AdminButton>

                {selectedCount > 0 && (
                  <AdminButton
                    variant="danger"
                    onClick={promptDeleteBulk}
                    disabled={deleting}
                  >
                    Delete Selected ({selectedCount})
                  </AdminButton>
                )}

                {pendingApps.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280', cursor: 'pointer', marginLeft: 'auto' }}>
                    <input
                      type="checkbox"
                      checked={pendingApps.length > 0 && selectedIds.size === pendingApps.length}
                      onChange={toggleSelectAll}
                    />
                    Select all pending
                  </label>
                )}
              </div>
            </div>

            {/* Applications List */}
            <div className="admin-card" style={{ borderRadius: 12 }}>
              <h2 className="admin-card-title">Applications ({applications.length})</h2>

              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  <p style={{ fontSize: '0.9375rem' }}>No applications found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {applications.map((app) => {
                    const isPaid = app.status === 'paid';
                    const isExpanded = expandedId === app.id;
                    return (
                      <div key={app.id}>
                        <div
                          onClick={() => toggleExpanded(app.id)}
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1rem',
                            borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                            border: '1px solid #e5e7eb',
                            borderBottom: isExpanded ? '1px solid #f3f4f6' : '1px solid #e5e7eb',
                            background: '#fff',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                          }}
                        >
                          {/* Checkbox for pending */}
                          <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                            {!isPaid ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(app.id)}
                                onChange={() => toggleSelect(app.id)}
                                style={{ width: 16, height: 16 }}
                              />
                            ) : (
                              <span style={{ display: 'inline-block', width: 16 }} />
                            )}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: isPaid ? 'linear-gradient(135deg, #059669, #34d399)' : 'linear-gradient(135deg, #d97706, #fbbf24)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                          }}>
                            {(app.first_name?.[0] || '?').toUpperCase()}
                          </div>

                          {/* Name & Email */}
                          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                              {app.first_name} {app.last_name}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{app.email}</div>
                          </div>

                          {/* Track */}
                          <div style={{ fontSize: '0.8125rem', color: '#374151', flexShrink: 0 }}>
                            {app.track_name}
                          </div>

                          {/* Status badge */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.2rem 0.6rem', fontSize: '0.6875rem', fontWeight: 600,
                            borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
                            background: isPaid ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                            color: isPaid ? '#059669' : '#d97706',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: isPaid ? '#059669' : '#d97706' }} />
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>

                          {/* Amount */}
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                            {app.amount ? formatCurrency(app.amount) : '—'}
                          </div>

                          {/* Delete button */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); promptDeleteSingle(app); }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600,
                                padding: '0.25rem 0.5rem', borderRadius: 6,
                              }}
                            >
                              Delete
                            </button>
                          )}

                          {/* Expand indicator */}
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem', flexShrink: 0 }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '0 0 8px 8px',
                            border: '1px solid #e5e7eb',
                            borderTop: 'none',
                            background: '#f9fafb',
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Phone</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.phone || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Referral Source</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.referral_source || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Payment Reference</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.payment_reference || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Discount Code</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.discount_code || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Application ID</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.application_id ?? app.id}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Applied</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{formatDate(app.created_at)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Paid</div>
                                <div style={{ fontSize: '0.875rem', color: '#111827' }}>{app.paid_at ? formatDate(app.paid_at) : '—'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Track Statistics */}
            {stats && stats.byTrack && Object.keys(stats.byTrack).length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Statistics by Track</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {Object.entries(stats.byTrack).map(([trackName, trackStats]) => (
                    <div key={trackName} style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '1.25rem',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                        {trackName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{trackStats.total}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paid</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#059669' }}>{trackStats.paid}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#d97706' }}>{trackStats.pending}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenue</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>₦{(trackStats.revenue / 100).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="admin-modal-overlay" onClick={cancelDelete}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Confirm Delete</h3>
            <p className="admin-modal-body">
              {deleteTarget
                ? <>Are you sure you want to delete the application from <strong>{deleteTarget.name}</strong>? This action cannot be undone.</>
                : <>Are you sure you want to delete <strong>{selectedCount}</strong> pending application{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.</>
              }
            </p>
            <div className="admin-modal-actions">
              <AdminButton variant="secondary" onClick={cancelDelete} disabled={deleting}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
