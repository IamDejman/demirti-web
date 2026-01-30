'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SponsoredApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmSpotId, setConfirmSpotId] = useState(null);
  const [confirmSpotUrl, setConfirmSpotUrl] = useState('');
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
    const t = new Date(acceptedAt).getTime() + 48 * 60 * 60 * 1000;
    return new Date(t);
  };

  const isPast48h = (acceptedAt) => {
    if (!acceptedAt) return false;
    return Date.now() > new Date(acceptedAt).getTime() + 48 * 60 * 60 * 1000;
  };

  const setReviewStatus = async (id, reviewStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reviewStatus })
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) await loadApplications();
      else alert(data.error || 'Update failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const markForfeited = async (id) => {
    if (!confirm('Mark this accepted application as forfeited (spot released)?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'mark_forfeited' })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) await loadApplications();
      else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const promoteWaitlist = async (id) => {
    if (!confirm('Send acceptance email to this waitlist applicant and set as accepted?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'promote_waitlist' })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) await loadApplications();
      else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitConfirmSpot = async (e) => {
    e.preventDefault();
    if (!confirmSpotId || !confirmSpotUrl?.trim()) return;
    setUpdatingId(confirmSpotId);
    try {
      const res = await fetch(`/api/admin/sponsored-applications/${confirmSpotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: 'confirm_spot', linkedinPostUrl: confirmSpotUrl.trim() })
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        setConfirmSpotId(null);
        setConfirmSpotUrl('');
        await loadApplications();
      } else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
      alert('Request failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filterStatus === 'all'
    ? applications
    : applications.filter((a) => a.review_status === filterStatus);

  return (
    <main className="admin-with-fixed-nav">
      <AdminNavbar />
      <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <h1 className="admin-page-title" style={{ marginBottom: '1.5rem' }}>Sponsored Applications</h1>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '600', color: '#666' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e1e4e8' }}
          >
            <option value="all">All</option>
            <option value="pending_review">Pending review</option>
            <option value="accepted">Accepted</option>
            <option value="waitlist">Waitlist</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={loadApplications}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>City</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Occupation</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666', maxWidth: '200px' }}>Essay</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Accepted / Confirm by</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>LinkedIn post</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Applied</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const confirmBy = getConfirmByDate(app.accepted_at);
                  const expired = app.review_status === 'accepted' && !app.confirmed_at && isPast48h(app.accepted_at);
                  const isUpdating = updatingId === app.id;
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>{app.first_name} {app.last_name}</td>
                      <td style={{ padding: '1rem' }}>{app.email}</td>
                      <td style={{ padding: '1rem' }}>{app.city || '—'}</td>
                      <td style={{ padding: '1rem', maxWidth: '150px' }}>{(app.occupation || '—').slice(0, 50)}{(app.occupation?.length > 50 ? '…' : '')}</td>
                      <td style={{ padding: '1rem', maxWidth: '200px', fontSize: '0.875rem' }}>{(app.essay || '').slice(0, 80)}…</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: app.review_status === 'accepted' ? '#d4edda' : app.review_status === 'waitlist' ? '#fff3cd' : app.review_status === 'rejected' ? '#f8d7da' : '#e2e3e5',
                          color: app.review_status === 'accepted' ? '#155724' : app.review_status === 'waitlist' ? '#856404' : app.review_status === 'rejected' ? '#721c24' : '#383d41'
                        }}>
                          {app.review_status === 'pending_review' ? 'Pending' : app.review_status}
                          {app.forfeited_at ? ' (forfeited)' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {app.accepted_at ? formatDate(app.accepted_at) : '—'}
                        {confirmBy && !app.confirmed_at && (
                          <div style={{ color: expired ? '#dc3545' : '#666', marginTop: '0.25rem' }}>
                            Confirm by {confirmBy.toLocaleString()}
                            {expired && ' (expired)'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {app.linkedin_post_url ? (
                          <a href={app.linkedin_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>View</a>
                        ) : confirmSpotId === app.id ? (
                          <form onSubmit={submitConfirmSpot} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="url"
                              placeholder="LinkedIn post URL"
                              value={confirmSpotUrl}
                              onChange={(e) => setConfirmSpotUrl(e.target.value)}
                              style={{ padding: '0.25rem 0.5rem', width: '180px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <button type="submit" disabled={isUpdating} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                            <button type="button" onClick={() => { setConfirmSpotId(null); setConfirmSpotUrl(''); }} style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                          </form>
                        ) : app.review_status === 'accepted' && !app.confirmed_at ? (
                          <button type="button" onClick={() => { setConfirmSpotId(app.id); setConfirmSpotUrl(''); }} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Confirm spot</button>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{formatDate(app.created_at)}</td>
                      <td style={{ padding: '1rem' }}>
                        {app.review_status === 'pending_review' && (
                          <>
                            <button type="button" onClick={() => setReviewStatus(app.id, 'accepted')} disabled={isUpdating} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Accept</button>
                            <button type="button" onClick={() => setReviewStatus(app.id, 'waitlist')} disabled={isUpdating} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Waitlist</button>
                            <button type="button" onClick={() => setReviewStatus(app.id, 'rejected')} disabled={isUpdating} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Reject</button>
                          </>
                        )}
                        {app.review_status === 'accepted' && !app.confirmed_at && isPast48h(app.accepted_at) && !app.forfeited_at && (
                          <button type="button" onClick={() => markForfeited(app.id)} disabled={isUpdating} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Mark forfeited</button>
                        )}
                        {app.review_status === 'waitlist' && (
                          <button type="button" onClick={() => promoteWaitlist(app.id)} disabled={isUpdating} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Offer spot</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No applications match the filter.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
