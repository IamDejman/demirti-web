'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminStatsGrid, AdminButton } from '../components/admin';

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
  const [deleteTarget, setDeleteTarget] = useState(null); // null = bulk, { id, name } = single
  const router = useRouter();

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Pending (unpaid) applications that can be selected
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

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);


  useEffect(() => {
    loadData();
    // Note: loadData is intentionally excluded from deps to prevent infinite loops
  }, [selectedTrack, selectedStatus]);


  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications
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

  // Format payment amounts - these are stored in kobo (from Paystack)
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

  // --- Delete logic ---
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
      // silently fail – loadData will show current state
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
            <div className="admin-loading admin-loading-center">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {stats && (
                <AdminStatsGrid
                  items={[
                    { label: 'Total Applications', value: stats.total, accent: 'primary' },
                    { label: 'Paid', value: stats.paid, accent: 'secondary' },
                    { label: 'Pending Payment', value: stats.pending, accent: 'warning' },
                    { label: 'Total Revenue', value: stats.totalRevenue, prefix: '₦', accent: 'success' },
                  ]}
                />
              )}

              <div className="admin-card admin-filters">
                <label>Filter by Track:</label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="all">All Tracks</option>
                  {getUniqueTracks().map(track => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>

                <label>Filter by Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="admin-form-input"
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
              </div>

              <div className="admin-card admin-table-container">
                <h2 className="admin-card-title">Applications ({applications.length})</h2>

                {applications.length === 0 ? (
                  <p className="admin-empty-state">No applications found</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr className="admin-table-thead-row">
                        <th className="admin-table-th" style={{ width: '2.5rem' }}>
                          <input
                            type="checkbox"
                            checked={pendingApps.length > 0 && selectedIds.size === pendingApps.length}
                            onChange={toggleSelectAll}
                            title="Select all pending applications"
                            disabled={pendingApps.length === 0}
                          />
                        </th>
                        <th className="admin-table-th" style={{ width: '2.5rem' }} aria-label="Expand" />
                        <th className="admin-table-th">Name</th>
                        <th className="admin-table-th">Email</th>
                        <th className="admin-table-th">Track</th>
                        <th className="admin-table-th">Status</th>
                        <th className="admin-table-th">Amount</th>
                        <th className="admin-table-th" style={{ width: '3rem' }} aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {applications.flatMap((app) => {
                        const isPaid = app.status === 'paid';
                        const rows = [
                          <tr
                            key={`${app.id}-main`}
                            className={`admin-table-tr ${expandedId === app.id ? 'admin-table-tr-expanded' : ''}`}
                            onClick={() => toggleExpanded(app.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="admin-table-td" onClick={(e) => e.stopPropagation()}>
                              {!isPaid ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(app.id)}
                                  onChange={() => toggleSelect(app.id)}
                                />
                              ) : (
                                <span style={{ display: 'inline-block', width: 16 }} />
                              )}
                            </td>
                            <td className="admin-table-td" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="admin-table-expand-btn"
                                onClick={() => toggleExpanded(app.id)}
                                aria-expanded={expandedId === app.id}
                                aria-label={expandedId === app.id ? 'Collapse details' : 'Expand details'}
                              >
                                {expandedId === app.id ? '▼' : '▶'}
                              </button>
                            </td>
                            <td className="admin-table-td">{app.first_name} {app.last_name}</td>
                            <td className="admin-table-td">{app.email}</td>
                            <td className="admin-table-td">{app.track_name}</td>
                            <td className="admin-table-td">
                              <span className={isPaid ? 'admin-badge-status-success' : 'admin-badge-status-warning'}>
                                {isPaid ? 'Paid' : '⏳ Pending'}
                              </span>
                            </td>
                            <td className="admin-table-td admin-table-td-strong">{app.amount ? formatCurrency(app.amount) : 'N/A'}</td>
                            <td className="admin-table-td" onClick={(e) => e.stopPropagation()}>
                              {!isPaid && (
                                <button
                                  type="button"
                                  className="admin-delete-btn"
                                  onClick={() => promptDeleteSingle(app)}
                                  title="Delete application"
                                  aria-label={`Delete ${app.first_name} ${app.last_name}`}
                                >
                                  🗑
                                </button>
                              )}
                            </td>
                          </tr>,
                        ];

                        if (expandedId === app.id) {
                          rows.push(
                            <tr key={`${app.id}-detail`} className="admin-table-detail-row">
                              <td colSpan={8} className="admin-table-detail-cell">
                                <div className="admin-table-detail-grid">
                                  <div><strong>Phone</strong><span>{app.phone || '—'}</span></div>
                                  <div><strong>Referral source</strong><span>{app.referral_source || '—'}</span></div>
                                  <div><strong>Payment reference</strong><span>{app.payment_reference || '—'}</span></div>
                                  <div><strong>Discount code</strong><span>{app.discount_code || '—'}</span></div>
                                  <div><strong>Application ID</strong><span>{app.application_id ?? app.id}</span></div>
                                  <div><strong>Applied</strong><span>{formatDate(app.created_at)}</span></div>
                                  <div><strong>Paid</strong><span>{app.paid_at ? formatDate(app.paid_at) : '—'}</span></div>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return rows;
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {stats && stats.byTrack && Object.keys(stats.byTrack).length > 0 && (
                <div className="admin-card admin-card-last admin-card-mt">
                  <h2 className="admin-card-title">Statistics by Track</h2>
                  <div className="admin-track-stats-grid">
                    {Object.entries(stats.byTrack).map(([trackName, trackStats]) => (
                      <div key={trackName} className="admin-track-stat-item">
                        <h3>{trackName}</h3>
                        <div className="admin-track-stat-row">
                          <p><strong>Total:</strong> {trackStats.total}</p>
                          <p className="paid"><strong>Paid:</strong> {trackStats.paid}</p>
                          <p className="pending"><strong>Pending:</strong> {trackStats.pending}</p>
                          <p className="revenue"><strong>Revenue:</strong> ₦{(trackStats.revenue / 100).toLocaleString()}</p>
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
