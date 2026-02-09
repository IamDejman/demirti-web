'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

function renderAction(row) {
  if (row.action === 'page.view') return 'Viewed page';
  return row.action || '—';
}

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

export default function AdminAuditLogsPage() {
  const router = useRouter();
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
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Audit Logs"
          description="System activity and page views. Times are in Lagos (WAT)."
          actions={
            <div className="admin-action-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div className="admin-form-group" style={{ flex: '1 1 200px', minWidth: 0 }}>
                <input
                  type="text"
                  placeholder="Search logs, pages, users..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, width: '100%' }}
                />
              </div>
              <button type="button" onClick={loadLogs} className="admin-btn admin-btn-primary">
                Search
              </button>
              <button type="button" onClick={handleExport} className="admin-btn admin-btn-secondary">
                Export CSV
              </button>
            </div>
          }
        />
        <div className="admin-card">
          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c' }}>
              {error}
              <br />
              <a href="/api/init-db" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'inline-block' }}>Initialize database →</a>
            </div>
          )}
          {loading ? (
            <p className="admin-loading">Loading logs...</p>
          ) : logs.length === 0 && !error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
              <p style={{ marginBottom: '0.5rem' }}>No logs found.</p>
              <p style={{ fontSize: '0.875rem' }}>Logs appear when users perform actions (login, create cohort, viewed page, etc.). Ensure the database is initialized via <a href="/api/init-db" target="_blank" rel="noopener noreferrer">/api/init-db</a>.</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="admin-cohort-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-table-th">Time (Lagos)</th>
                    <th className="admin-table-th">User</th>
                    <th className="admin-table-th">Action</th>
                    <th className="admin-table-th">Page</th>
                    <th className="admin-table-th">Target Type</th>
                    <th className="admin-table-th">Target ID</th>
                    <th className="admin-table-th">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id} className="admin-table-tr">
                      <td className="admin-table-td" style={{ whiteSpace: 'nowrap' }}>{formatTimeLagos(row.created_at)}</td>
                      <td className="admin-table-td">{row.user_email || 'System'}</td>
                      <td className="admin-table-td">{renderAction(row)}</td>
                      <td className="admin-table-td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderPage(row)}</td>
                      <td className="admin-table-td">{row.target_type || '—'}</td>
                      <td className="admin-table-td" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.target_id || '—'}</td>
                      <td className="admin-table-td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderDetails(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
    </div>
  );
}
