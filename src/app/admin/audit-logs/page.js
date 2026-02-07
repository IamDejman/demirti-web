'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit-logs?q=${encodeURIComponent(query.trim())}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.logs) setLogs(data.logs);
    setLoading(false);
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
          description="Search and export system activity logs."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search logs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button type="button" onClick={loadLogs} className="px-3 py-2 bg-primary text-white text-sm rounded-lg">
                Search
              </button>
              <button type="button" onClick={handleExport} className="px-3 py-2 border border-gray-300 text-sm rounded-lg">
                Export CSV
              </button>
            </div>
          }
        />
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <p className="text-gray-500">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-500">No logs found.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.user_email || 'System'} · {log.target_type || 'n/a'} {log.target_id ? `· ${log.target_id}` : ''}
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}
