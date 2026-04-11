'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';
import AdminButton from '../../components/admin/AdminButton';
import { useToast } from '../../components/ToastProvider';

import { getAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

function renderPage(row) {
  if (row.action === 'page.view') {
    const path = row.details?.path ?? row.target_id;
    return path || '—';
  }
  return '—';
}

function renderDetails(row) {
  if (row.action === 'page.view') return '—';
  if (!row.details) return '—';
  if (typeof row.details === 'string') return row.details;
  const obj = row.details;
  if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
    const filtered = { ...obj };
    delete filtered.actor_email;
    delete filtered.path;
    if (Object.keys(filtered).length === 0) return '—';
    return JSON.stringify(filtered);
  }
  return '—';
}

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.125rem',
};

const valueStyle = {
  fontSize: '0.875rem',
  color: '#1f2937',
  lineHeight: 1.4,
};

function ActionBadge({ action }) {
  const isPageView = action === 'page.view';
  const color = isPageView ? '#6b7280' : '#2563eb';
  const bg = isPageView ? 'rgba(107, 114, 128, 0.1)' : 'rgba(37, 99, 235, 0.1)';
  const label = isPageView ? 'Viewed page' : (action || '—');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 6,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?q=${encodeURIComponent(query.trim())}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.logs) setLogs(data.logs);
      else if (res.status === 401) router.push('/admin/login');
      else setError(data.detail || data.error || 'Failed to load logs');
    } catch (e) {
      setLogs([]);
      setError(e?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', message: error });
  }, [error, showToast]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadLogs();
  }, [router]);

  const handleExport = () => {
    const url = `/api/admin/audit-logs?format=csv&q=${encodeURIComponent(query.trim())}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <AdminPageHeader
        title="Audit Logs"
        description="System activity and page views. Times are in Lagos (WAT)."
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <input
                type="text"
                placeholder="Search logs, pages, users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  width: '100%',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <AdminButton variant="primary" onClick={loadLogs}>
              Search
            </AdminButton>
            <AdminButton variant="secondary" onClick={handleExport}>
              Export CSV
            </AdminButton>
          </div>
        }
      />

      {/* Log entries container */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Loading logs...
          </div>
        ) : logs.length === 0 && !error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>No logs found.</p>
            <p style={{ fontSize: '0.875rem' }}>
              Logs appear when users perform actions (login, create cohort, viewed page, etc.). Ensure the database is initialized via{' '}
              <a href="/api/init-db" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                /api/init-db
              </a>.
            </p>
          </div>
        ) : logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Column header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <div style={{ ...labelStyle, flex: '0 0 140px', marginBottom: 0 }}>Time (Lagos)</div>
              <div style={{ ...labelStyle, flex: '0 0 180px', marginBottom: 0 }}>User</div>
              <div style={{ ...labelStyle, flex: '0 0 120px', marginBottom: 0 }}>Action</div>
              <div style={{ ...labelStyle, flex: '1 1 180px', minWidth: 0, marginBottom: 0 }}>Page</div>
              <div style={{ ...labelStyle, flex: '1 1 200px', minWidth: 0, marginBottom: 0 }}>Details</div>
            </div>

            {logs.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Timestamp */}
                <div style={{ flex: '0 0 140px' }}>
                  <div style={{ ...valueStyle, whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                    {formatTimeLagos(row.created_at)}
                  </div>
                </div>

                {/* User email */}
                <div style={{ flex: '0 0 180px', overflow: 'hidden' }}>
                  <div
                    style={{
                      ...valueStyle,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {row.user_email || 'System'}
                  </div>
                </div>

                {/* Action */}
                <div style={{ flex: '0 0 120px' }}>
                  <ActionBadge action={row.action} />
                </div>

                {/* Page */}
                <div style={{ flex: '1 1 180px', minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      ...valueStyle,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                    }}
                  >
                    {renderPage(row)}
                  </div>
                </div>

                {/* Details */}
                <div style={{ flex: '1 1 200px', minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      ...valueStyle,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                    }}
                  >
                    {renderDetails(row)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Log count */}
      {!loading && logs.length > 0 && (
        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
          <span style={{ ...labelStyle, fontSize: '0.75rem' }}>
            {logs.length} log{logs.length !== 1 ? 's' : ''} shown
          </span>
        </div>
      )}
    </div>
  );
}
