'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminEmptyState,
} from '../../components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

export default function AdminModerationPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const buildFilterParams = (override = {}) => {
    const room = override.roomFilter ?? roomFilter;
    const sender = override.senderFilter ?? senderFilter;
    const from = override.fromFilter ?? fromFilter;
    const to = override.toFilter ?? toFilter;
    const params = new URLSearchParams();
    if (room.trim()) params.set('room', room.trim());
    if (sender.trim()) params.set('sender', sender.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return query ? `?${query}` : '';
  };

  const loadReports = async (override = {}) => {
    const query = buildFilterParams(override);
    const res = await fetch(`/api/admin/chat/reports${query}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.reports) setReports(data.reports);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadReports().finally(() => setLoading(false));
  }, [router]);

  const handleResolve = async (reportId, action) => {
    await fetch(`/api/admin/chat/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action }),
    });
    await loadReports();
  };

  const handleSuspend = async (userId, days) => {
    const until = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
    await fetch(`/api/admin/users/${userId}/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'suspend', suspendUntil: until ? until.toISOString() : null }),
    });
    await loadReports();
  };

  const handleShadowban = async (userId, isShadowbanned) => {
    await fetch(`/api/admin/users/${userId}/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: isShadowbanned ? 'shadowban' : 'unshadowban' }),
    });
    await loadReports();
  };

  const handleModerationAction = async (userId, action) => {
    await fetch(`/api/admin/users/${userId}/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action }),
    });
    await loadReports();
  };

  const clearFilters = async () => {
    setRoomFilter('');
    setSenderFilter('');
    setFromFilter('');
    setToFilter('');
    setIsFiltering(true);
    await loadReports({ roomFilter: '', senderFilter: '', fromFilter: '', toFilter: '' });
    setIsFiltering(false);
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Moderation Queue"
        description="Review and act on reported chat messages."
      />

      <AdminCard>
        <div className="admin-filters-grid">
          <AdminFormField>
            <input
              type="text"
              placeholder="Filter by room"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField>
            <input
              type="text"
              placeholder="Filter by sender"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="From">
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="To">
            <input
              type="date"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
        </div>
        <div className="admin-action-group" style={{ marginTop: '1rem' }}>
          <AdminButton
            variant="primary"
            onClick={async () => {
              setIsFiltering(true);
              await loadReports();
              setIsFiltering(false);
            }}
            disabled={isFiltering}
          >
            {isFiltering ? 'Filtering...' : 'Apply filters'}
          </AdminButton>
          <AdminButton variant="secondary" onClick={clearFilters} disabled={isFiltering}>
            Clear
          </AdminButton>
        </div>
      </AdminCard>

      {loading ? (
        <p className="admin-loading">Loading reports...</p>
      ) : reports.length === 0 ? (
        <AdminCard>
          <AdminEmptyState message="No reports pending." description="The moderation queue is empty." />
        </AdminCard>
      ) : (
        <AdminCard title="Reports">
          <ul className="admin-list">
            {reports.map((r) => (
              <li key={r.report_id} className="admin-list-item admin-moderation-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">Reported message</p>
                  <div className="admin-action-group">
                    <button
                      type="button"
                      onClick={() => handleResolve(r.report_id, 'escalate')}
                      className="admin-link admin-link-warning"
                    >
                      Escalate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(r.report_id, 'dismiss')}
                      className="admin-link"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(r.report_id, 'delete')}
                      className="admin-link admin-link-danger"
                    >
                      Delete message
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-body" style={{ marginTop: '0.5rem' }}>{r.message_body}</p>
                <p className="admin-list-item-meta" style={{ marginTop: '0.5rem' }}>
                  Room: {r.room_title || r.room_type} · Sender: {r.sender_email} · Reporter: {r.reporter_email}
                </p>
                {r.is_escalated && (
                  <span className="admin-badge admin-badge-warning">Escalated</span>
                )}
                <div className="admin-action-group admin-moderation-actions">
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleModerationAction(r.sender_id, 'warn')}
                  >
                    Warn
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleSuspend(r.sender_id, 7)}
                  >
                    Suspend 7d
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleSuspend(r.sender_id, null)}
                  >
                    Unsuspend
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleShadowban(r.sender_id, true)}
                  >
                    Shadowban
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleShadowban(r.sender_id, false)}
                  >
                    Unshadowban
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleModerationAction(r.sender_id, 'deactivate')}
                  >
                    Deactivate
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="admin-btn-sm"
                    onClick={() => handleModerationAction(r.sender_id, 'reactivate')}
                  >
                    Reactivate
                  </AdminButton>
                </div>
                {r.reason && (
                  <p className="admin-list-item-meta" style={{ marginTop: '0.5rem' }}>Reason: {r.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}
