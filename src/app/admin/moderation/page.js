'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminButton,
} from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

const REPORT_STATUS_CONFIG = {
  pending: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', label: 'Pending' },
  resolved: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Resolved' },
  escalated: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Escalated' },
};

function StatusBadge({ status }) {
  const config = REPORT_STATUS_CONFIG[status] || REPORT_STATUS_CONFIG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  );
}

function UserAvatar({ email }) {
  const initials = email
    ? email.substring(0, 2).toUpperCase()
    : '??';
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Label({ children }) {
  return (
    <span
      style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#6b7280',
      }}
    >
      {children}
    </span>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.875rem',
  color: '#1f2937',
  outline: 'none',
  background: '#fff',
};

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

  const pendingCount = reports.filter((r) => !r.resolved_at).length;
  const escalatedCount = reports.filter((r) => r.is_escalated).length;

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #dbeafe', borderTopColor: '#0052a3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <AdminPageHeader
        title="Moderation Queue"
        description="Review and act on reported chat messages."
      />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Reports', value: reports.length },
          { label: 'Pending', value: pendingCount },
          { label: 'Escalated', value: escalatedCount },
          { label: 'Resolved', value: reports.length - pendingCount },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
              padding: '1.25rem',
            }}
          >
            <Label>{stat.label}</Label>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginTop: '0.375rem' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: '#fff',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <Label>Filters</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#374151', marginBottom: '0.25rem' }}>Room</label>
            <input
              type="text"
              placeholder="Filter by room"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#374151', marginBottom: '0.25rem' }}>Sender</label>
            <input
              type="text"
              placeholder="Filter by sender"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#374151', marginBottom: '0.25rem' }}>From</label>
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#374151', marginBottom: '0.25rem' }}>To</label>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
      </div>

      {/* Reports */}
      {reports.length === 0 ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            No reports pending
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>The moderation queue is empty.</p>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Label>Reports ({reports.length})</Label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.map((r) => {
              const reportStatus = r.is_escalated ? 'escalated' : r.resolved_at ? 'resolved' : 'pending';
              return (
                <div
                  key={r.report_id}
                  style={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    padding: '0.875rem 1rem',
                  }}
                >
                  {/* Top row: avatar, sender info, status badge, resolve actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <UserAvatar email={r.sender_email} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                          {r.sender_email}
                        </span>
                        <StatusBadge status={reportStatus} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.75rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          Room: {r.room_title || r.room_type}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>|</span>
                        <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          Reporter: {r.reporter_email}
                        </span>
                      </div>
                    </div>
                    {/* Resolve actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'escalate')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: '#d97706',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        Escalate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'dismiss')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: '#6b7280',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'delete')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: '#dc2626',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        Delete message
                      </button>
                    </div>
                  </div>

                  {/* Message body */}
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 6,
                      background: '#f9fafb',
                      fontSize: '0.875rem',
                      color: '#374151',
                      lineHeight: 1.5,
                    }}
                  >
                    {r.message_body}
                  </div>

                  {/* Reason */}
                  {r.reason && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                      <span style={{ fontWeight: 600 }}>Reason:</span> {r.reason}
                    </div>
                  )}

                  {/* Moderation actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleModerationAction(r.sender_id, 'warn')}
                    >
                      Warn
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleSuspend(r.sender_id, 7)}
                    >
                      Suspend 7d
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleSuspend(r.sender_id, null)}
                    >
                      Unsuspend
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleShadowban(r.sender_id, true)}
                    >
                      Shadowban
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleShadowban(r.sender_id, false)}
                    >
                      Unshadowban
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleModerationAction(r.sender_id, 'deactivate')}
                    >
                      Deactivate
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleModerationAction(r.sender_id, 'reactivate')}
                    >
                      Reactivate
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
