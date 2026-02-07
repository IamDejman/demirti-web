'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setMobile(mq.matches);
    const listener = () => setMobile(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [breakpoint]);
  return mobile;
}

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

export default function SponsoredApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewApp, setViewApp] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmSpotUrl, setConfirmSpotUrl] = useState('');
  const detailPrintRef = useRef(null);
  const isMobile = useMobile(768);
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
    } catch (e) {
      console.error(e);
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
      } else alert(data.error || 'Update failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
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
      } else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
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
      } else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
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
      } else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
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
<div>${detailPrintRef.current.innerHTML}</div>
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
  const viewFirstSelected = () => {
    const first = filtered.find((a) => selectedIds.has(a.id));
    if (first) setViewApp(first);
  };

  const sectionStyle = { marginBottom: '1.25rem' };
  const labelStyle = { fontWeight: '600', color: '#555', fontSize: '0.8rem', marginBottom: '0.25rem' };
  const valueStyle = { fontSize: '0.95rem', color: '#1a1a1a' };
  const statusBadge = (app) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'inline-block',
    backgroundColor: app.review_status === 'accepted' ? '#d4edda' : app.review_status === 'waitlist' ? '#fff3cd' : app.review_status === 'rejected' ? '#f8d7da' : '#e2e3e5',
    color: app.review_status === 'accepted' ? '#155724' : app.review_status === 'waitlist' ? '#856404' : app.review_status === 'rejected' ? '#721c24' : '#383d41'
  });

  return (
    <>
    <div className="admin-dashboard admin-dashboard-content sponsored-apps-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', boxSizing: 'border-box' }}>
        <AdminPageHeader
          title="Sponsored Applications"
          description="Review and manage sponsored application submissions."
        />
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '600', color: '#666' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e1e4e8', minWidth: '140px' }}
          >
            <option value="all">All</option>
            <option value="pending_review">Pending review</option>
            <option value="accepted">Accepted</option>
            <option value="waitlist">Waitlist</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="button" onClick={loadApplications} style={{ padding: '0.5rem 1rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Refresh</button>
          <button type="button" onClick={exportAllCsv} disabled={filtered.length === 0} style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: filtered.length ? 'pointer' : 'not-allowed', fontWeight: '600', opacity: filtered.length ? 1 : 0.6 }}>Export CSV (all)</button>
          {selectedCount > 0 && (
            <button type="button" onClick={viewFirstSelected} style={{ padding: '0.5rem 1rem', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>View selected ({selectedCount})</button>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '100%' : '400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#666', width: '44px' }}>
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Applied</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#666', width: '100px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)} aria-label={`Select ${app.first_name}`} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{app.first_name} {app.last_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><a href={`mailto:${app.email}`} style={{ color: '#0066cc' }}>{app.email}</a></td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{formatDate(app.created_at)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button type="button" onClick={() => setViewApp(app)} style={{ padding: '0.35rem 0.75rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No applications match the filter.</p>
            )}
          </div>
        )}

        {/* Detail view modal */}
        {viewApp && (
          <>
            <div role="dialog" aria-modal="true" aria-labelledby="detail-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }} onClick={() => setViewApp(null)}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 id="detail-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700' }}>Application details</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => exportSingleCsv(viewApp)} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Export CSV</button>
                    <button type="button" onClick={printDetailPdf} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Print / PDF</button>
                    <button type="button" onClick={() => setViewApp(null)} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Close</button>
                  </div>
                </div>
                <div style={{ padding: '1.5rem 2rem' }} ref={detailPrintRef}>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Name</div>
                    <div style={valueStyle}>{viewApp.first_name} {viewApp.last_name}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Email</div>
                    <div style={valueStyle}><a href={`mailto:${viewApp.email}`} style={{ color: '#0066cc' }}>{viewApp.email}</a></div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Phone</div>
                    <div style={valueStyle}>{viewApp.phone || '—'}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>LinkedIn profile</div>
                    <div style={valueStyle}>{viewApp.linkedin_url ? <a href={viewApp.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>{viewApp.linkedin_url}</a> : '—'}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>City</div>
                    <div style={valueStyle}>{viewApp.city || '—'}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Status / Occupation</div>
                    <div style={valueStyle}>{viewApp.occupation || '—'}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Review status</div>
                    <div style={valueStyle}><span style={statusBadge(viewApp)}>{viewApp.review_status === 'pending_review' ? 'Pending' : viewApp.review_status}{viewApp.forfeited_at ? ' (forfeited)' : ''}</span></div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Essay</div>
                    <div style={{ ...valueStyle, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{viewApp.essay || '—'}</div>
                  </div>
                  <div style={sectionStyle}>
                    <div style={labelStyle}>Applied</div>
                    <div style={valueStyle}>{formatDate(viewApp.created_at)}</div>
                  </div>
                  {viewApp.accepted_at && (
                    <div style={sectionStyle}>
                      <div style={labelStyle}>Accepted at</div>
                      <div style={valueStyle}>{formatDate(viewApp.accepted_at)}</div>
                      {getConfirmByDate(viewApp.accepted_at) && !viewApp.confirmed_at && (
                        <div style={{ fontSize: '0.875rem', color: isPast48h(viewApp.accepted_at) ? '#dc3545' : '#666', marginTop: '0.25rem' }}>Confirm by {getConfirmByDate(viewApp.accepted_at).toLocaleString()}{isPast48h(viewApp.accepted_at) ? ' (expired)' : ''}</div>
                      )}
                    </div>
                  )}
                  {viewApp.review_status === 'accepted' && !viewApp.confirmed_at && (
                    <div style={sectionStyle}>
                      <div style={labelStyle}>Confirm spot (LinkedIn post URL)</div>
                      {viewApp.linkedin_post_url ? (
                        <div style={valueStyle}><a href={viewApp.linkedin_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>View post</a></div>
                      ) : (
                        <form onSubmit={submitConfirmSpot} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input type="url" placeholder="https://linkedin.com/..." value={confirmSpotUrl} onChange={(e) => setConfirmSpotUrl(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }} required />
                          <button type="submit" disabled={updatingId === viewApp.id} style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>Save</button>
                        </form>
                      )}
                    </div>
                  )}
                  {viewApp.confirmed_at && (
                    <div style={sectionStyle}>
                      <div style={labelStyle}>Confirmed at</div>
                      <div style={valueStyle}>{formatDate(viewApp.confirmed_at)}</div>
                      {viewApp.linkedin_post_url && <div style={valueStyle}><a href={viewApp.linkedin_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>LinkedIn post</a></div>}
                    </div>
                  )}

                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e1e4e8' }}>
                    <div style={labelStyle}>Actions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {viewApp.review_status === 'pending_review' && (
                        <>
                          <button type="button" onClick={() => setReviewStatus(viewApp.id, 'accepted', 'Send acceptance email and set as Accepted?')} disabled={updatingId === viewApp.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Accept</button>
                          <button type="button" onClick={() => setReviewStatus(viewApp.id, 'waitlist', 'Send waitlist email?')} disabled={updatingId === viewApp.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Waitlist</button>
                          <button type="button" onClick={() => setReviewStatus(viewApp.id, 'rejected', 'Send rejection email?')} disabled={updatingId === viewApp.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Reject</button>
                        </>
                      )}
                      {viewApp.review_status === 'accepted' && !viewApp.confirmed_at && isPast48h(viewApp.accepted_at) && !viewApp.forfeited_at && (
                        <button type="button" onClick={() => markForfeited(viewApp.id)} disabled={updatingId === viewApp.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Mark forfeited</button>
                      )}
                      {viewApp.review_status === 'waitlist' && (
                        <button type="button" onClick={() => promoteWaitlist(viewApp.id)} disabled={updatingId === viewApp.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Offer spot</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .sponsored-apps-content {
            padding: 1rem !important;
          }
        }
      `}</style>
    </>
  );
}
