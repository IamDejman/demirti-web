'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';
import { AdminPageHeader, AdminButton } from '../../components/admin';
import { useToast } from '../../components/ToastProvider';

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
  return [
    app.application_id,
    app.first_name,
    app.last_name,
    app.email,
    app.phone,
    app.linkedin_url || '',
    app.city || '',
    app.occupation || '',
    (app.essay || '').replace(/\n/g, ' '),
    app.review_status,
    app.accepted_at || '',
    app.linkedin_post_url || '',
    app.confirmed_at || '',
    app.forfeited_at || '',
    app.cohort_name || '',
    app.created_at
  ].map(escapeCsvCell).join(',');
}

const CSV_HEADER = 'Application ID,First Name,Last Name,Email,Phone,LinkedIn URL,City,Occupation,Essay,Review Status,Accepted At,LinkedIn Post URL,Confirmed At,Forfeited At,Cohort,Created At\n';

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const STATUS_CONFIG = {
  pending_review: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Pending' },
  accepted: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Accepted' },
  waitlist: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', label: 'Waitlist' },
  rejected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Rejected' },
};

const STAT_COLORS = {
  total: '#0052a3',
  pending: '#6b7280',
  accepted: '#059669',
  waitlist: '#d97706',
  rejected: '#ef4444',
};

export default function SponsoredApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewApp, setViewApp] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmSpotUrl, setConfirmSpotUrl] = useState('');
  const detailPrintRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('reviewStatus', filterStatus);
      const res = await fetch(`/api/admin/sponsored-applications?${params}`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) setApplications(data.applications);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');
  const getConfirmByDate = (acceptedAt) => {
    if (!acceptedAt) return null;
    return new Date(new Date(acceptedAt).getTime() + 48 * 60 * 60 * 1000);
  };
  const isPast48h = (acceptedAt) => {
    if (!acceptedAt) return false;
    return Date.now() > new Date(acceptedAt).getTime() + 48 * 60 * 60 * 1000;
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((a) => a.id)));
  };

  const setReviewStatus = async (id, reviewStatus, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reviewStatus })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        await loadApplications();
        if (viewApp?.id === id) setViewApp(null);
      } else showToast({ type: 'error', message: data.error || 'Update failed' });
    } catch {
      showToast({ type: 'error', message: 'Request failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const markForfeited = async (id) => {
    if (!window.confirm('Mark this accepted application as forfeited (spot released)?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'mark_forfeited' })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        await loadApplications();
        if (viewApp?.id === id) setViewApp(null);
      } else showToast({ type: 'error', message: data.error || 'Failed' });
    } catch {
      showToast({ type: 'error', message: 'Request failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const promoteWaitlist = async (id) => {
    if (!window.confirm('Send acceptance email to this waitlist applicant and set as accepted?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'promote_waitlist' })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        await loadApplications();
        if (viewApp?.id === id) setViewApp(null);
      } else showToast({ type: 'error', message: data.error || 'Failed' });
    } catch {
      showToast({ type: 'error', message: 'Request failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const submitConfirmSpot = async (e) => {
    e.preventDefault();
    const app = viewApp;
    if (!app || !confirmSpotUrl?.trim()) return;
    setUpdatingId(app.id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'confirm_spot', linkedinPostUrl: confirmSpotUrl.trim() })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        setConfirmSpotUrl('');
        await loadApplications();
        setViewApp(null);
      } else showToast({ type: 'error', message: data.error || 'Failed' });
    } catch {
      showToast({ type: 'error', message: 'Request failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const exportAllCsv = () => {
    const rows = filtered.map(appToCsvRow).join('\n');
    downloadCsv(CSV_HEADER + rows, `sponsored-applications-${filterStatus === 'all' ? 'all' : filterStatus}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportSingleCsv = (app) => {
    downloadCsv(CSV_HEADER + appToCsvRow(app), `sponsored-application-${app.application_id}.csv`);
  };

  const printDetailPdf = () => {
    if (!detailPrintRef.current || !viewApp) return;
    const title = `Application - ${viewApp.first_name} ${viewApp.last_name} - ${viewApp.email}`;
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:640px;margin:0 auto;line-height:1.6;color:#1a1a1a}
h1{font-size:1.5rem;margin-bottom:1.5rem;border-bottom:2px solid #0066cc;padding-bottom:0.5rem}
.section{margin-bottom:1.25rem}.label{font-weight:600;color:#555;font-size:0.85rem;margin-bottom:0.25rem}
.value{font-size:0.95rem}.value a{color:#0066cc}pre{white-space:pre-wrap;margin:0}</style></head><body>
<h1>Sponsored application details</h1>
<div>${sanitizeHtml(detailPrintRef.current?.innerHTML || '', ['p', 'div', 'span', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'])}</div>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const filtered = filterStatus === 'all'
    ? applications
    : applications.filter((a) => a.review_status === filterStatus);
  const selectedCount = selectedIds.size;

  // Compute stats
  const statCounts = {
    total: applications.length,
    pending_review: applications.filter(a => a.review_status === 'pending_review').length,
    accepted: applications.filter(a => a.review_status === 'accepted').length,
    waitlist: applications.filter(a => a.review_status === 'waitlist').length,
    rejected: applications.filter(a => a.review_status === 'rejected').length,
  };

  const labelStyle = { fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' };

  return (
    <>
      <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Sponsored Applications"
          description="Review and manage sponsored application submissions."
        />

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: statCounts.total, color: STAT_COLORS.total },
            { label: 'Pending', value: statCounts.pending_review, color: STAT_COLORS.pending },
            { label: 'Accepted', value: statCounts.accepted, color: STAT_COLORS.accepted },
            { label: 'Waitlist', value: statCounts.waitlist, color: STAT_COLORS.waitlist },
            { label: 'Rejected', value: statCounts.rejected, color: STAT_COLORS.rejected },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid #e5e7eb',
              borderTop: `3px solid ${stat.color}`,
            }}>
              <div style={labelStyle}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="admin-card" style={{ borderRadius: 12, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-form-input"
              style={{ minWidth: 160 }}
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="accepted">Accepted</option>
              <option value="waitlist">Waitlist</option>
              <option value="rejected">Rejected</option>
            </select>

            <AdminButton variant="primary" onClick={loadApplications}>Refresh</AdminButton>
            <AdminButton variant="secondary" onClick={exportAllCsv} disabled={filtered.length === 0}>Export CSV</AdminButton>

            {filtered.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280', cursor: 'pointer', marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                />
                Select all ({filtered.length})
              </label>
            )}
          </div>
        </div>

        {/* Applications List */}
        <div className="admin-card" style={{ borderRadius: 12 }}>
          <h2 className="admin-card-title">Applications ({filtered.length})</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p style={{ fontSize: '0.9375rem' }}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p style={{ fontSize: '0.9375rem' }}>No applications match the filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((app) => {
                const config = STATUS_CONFIG[app.review_status] || STATUS_CONFIG.pending_review;
                return (
                  <div key={app.id} style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: selectedIds.has(app.id) ? 'rgba(0, 82, 163, 0.03)' : '#fff',
                    transition: 'border-color 0.2s',
                  }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelect(app.id)}
                      style={{ width: 16, height: 16, flexShrink: 0 }}
                    />

                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
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

                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.2rem 0.6rem', fontSize: '0.6875rem', fontWeight: 600,
                      borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: config.bg, color: config.color,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color }} />
                      {config.label}{app.forfeited_at ? ' (forfeited)' : ''}
                    </span>

                    {/* Date */}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
                      Applied {formatDate(app.created_at)}
                    </div>

                    {/* View button */}
                    <AdminButton variant="secondary" onClick={() => setViewApp(app)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}>
                      View
                    </AdminButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail view modal */}
      {viewApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', boxSizing: 'border-box',
          }}
          onClick={() => setViewApp(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <h2 id="detail-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                Application Details
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <AdminButton variant="secondary" onClick={() => exportSingleCsv(viewApp)}>Export CSV</AdminButton>
                <AdminButton variant="secondary" onClick={printDetailPdf}>Print / PDF</AdminButton>
                <AdminButton variant="secondary" onClick={() => setViewApp(null)}>Close</AdminButton>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.5rem' }} ref={detailPrintRef}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={labelStyle}>Name</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{viewApp.first_name} {viewApp.last_name}</div>
                </div>
                <div>
                  <div style={labelStyle}>Email</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}><a href={`mailto:${viewApp.email}`} style={{ color: '#0052a3' }}>{viewApp.email}</a></div>
                </div>
                <div>
                  <div style={labelStyle}>Phone</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{viewApp.phone || '—'}</div>
                </div>
                <div>
                  <div style={labelStyle}>City</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{viewApp.city || '—'}</div>
                </div>
                <div>
                  <div style={labelStyle}>LinkedIn Profile</div>
                  <div style={{ fontSize: '0.9375rem' }}>
                    {viewApp.linkedin_url
                      ? <a href={viewApp.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0052a3' }}>{viewApp.linkedin_url}</a>
                      : <span style={{ color: '#6b7280' }}>—</span>
                    }
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Occupation</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{viewApp.occupation || '—'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Review Status</div>
                  <div>
                    {(() => {
                      const cfg = STATUS_CONFIG[viewApp.review_status] || STATUS_CONFIG.pending_review;
                      return (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.2rem 0.6rem', fontSize: '0.6875rem', fontWeight: 600,
                          borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: cfg.bg, color: cfg.color,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
                          {cfg.label}{viewApp.forfeited_at ? ' (forfeited)' : ''}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Applied</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{formatDate(viewApp.created_at)}</div>
                </div>
              </div>

              {/* Essay */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={labelStyle}>Essay</div>
                <div style={{ fontSize: '0.9375rem', color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: '0.25rem' }}>
                  {viewApp.essay || '—'}
                </div>
              </div>

              {/* Accepted info */}
              {viewApp.accepted_at && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={labelStyle}>Accepted at</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{formatDate(viewApp.accepted_at)}</div>
                  {getConfirmByDate(viewApp.accepted_at) && !viewApp.confirmed_at && (
                    <div style={{ fontSize: '0.8125rem', color: isPast48h(viewApp.accepted_at) ? '#ef4444' : '#6b7280', marginTop: '0.25rem' }}>
                      Confirm by {getConfirmByDate(viewApp.accepted_at).toLocaleString()}{isPast48h(viewApp.accepted_at) ? ' (expired)' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm spot form */}
              {viewApp.review_status === 'accepted' && !viewApp.confirmed_at && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={labelStyle}>Confirm Spot (LinkedIn Post URL)</div>
                  {viewApp.linkedin_post_url ? (
                    <div style={{ fontSize: '0.9375rem' }}>
                      <a href={viewApp.linkedin_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0052a3' }}>View post</a>
                    </div>
                  ) : (
                    <form onSubmit={submitConfirmSpot} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/..."
                        value={confirmSpotUrl}
                        onChange={(e) => setConfirmSpotUrl(e.target.value)}
                        className="admin-form-input"
                        style={{ flex: 1 }}
                        required
                      />
                      <AdminButton type="submit" variant="primary" disabled={updatingId === viewApp.id}>Save</AdminButton>
                    </form>
                  )}
                </div>
              )}

              {/* Confirmed info */}
              {viewApp.confirmed_at && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={labelStyle}>Confirmed at</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{formatDate(viewApp.confirmed_at)}</div>
                  {viewApp.linkedin_post_url && (
                    <a href={viewApp.linkedin_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0052a3', fontSize: '0.875rem' }}>LinkedIn post</a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Actions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {viewApp.review_status === 'pending_review' && (
                    <>
                      <AdminButton variant="primary" onClick={() => setReviewStatus(viewApp.id, 'accepted', 'Send acceptance email and set as Accepted?')} disabled={updatingId === viewApp.id}>Accept</AdminButton>
                      <AdminButton variant="secondary" onClick={() => setReviewStatus(viewApp.id, 'waitlist', 'Send waitlist email?')} disabled={updatingId === viewApp.id}>Waitlist</AdminButton>
                      <AdminButton variant="danger" onClick={() => setReviewStatus(viewApp.id, 'rejected', 'Send rejection email?')} disabled={updatingId === viewApp.id}>Reject</AdminButton>
                    </>
                  )}
                  {viewApp.review_status === 'accepted' && !viewApp.confirmed_at && isPast48h(viewApp.accepted_at) && !viewApp.forfeited_at && (
                    <AdminButton variant="secondary" onClick={() => markForfeited(viewApp.id)} disabled={updatingId === viewApp.id}>Mark Forfeited</AdminButton>
                  )}
                  {viewApp.review_status === 'waitlist' && (
                    <AdminButton variant="primary" onClick={() => promoteWaitlist(viewApp.id)} disabled={updatingId === viewApp.id}>Offer Spot</AdminButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
