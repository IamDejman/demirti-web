'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="Filter by room"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Filter by sender"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <label className="text-xs text-gray-600">
              From
              <input
                type="date"
                value={fromFilter}
                onChange={(e) => setFromFilter(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </label>
            <label className="text-xs text-gray-600">
              To
              <input
                type="date"
                value={toFilter}
                onChange={(e) => setToFilter(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setIsFiltering(true);
                await loadReports();
                setIsFiltering(false);
              }}
              className="px-3 py-2 bg-primary text-white text-sm rounded-lg"
            >
              {isFiltering ? 'Filtering...' : 'Apply filters'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setRoomFilter('');
                setSenderFilter('');
                setFromFilter('');
                setToFilter('');
                setIsFiltering(true);
                await loadReports({ roomFilter: '', senderFilter: '', fromFilter: '', toFilter: '' });
                setIsFiltering(false);
              }}
              className="px-3 py-2 border border-gray-300 text-sm rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-gray-500 mt-4">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 mt-4">No reports pending.</p>
        ) : (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-4">
              {reports.map((r) => (
                <li key={r.report_id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">Reported message</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'escalate')}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Escalate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'dismiss')}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(r.report_id, 'delete')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete message
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{r.message_body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Room: {r.room_title || r.room_type} · Sender: {r.sender_email} · Reporter: {r.reporter_email}
                  </p>
                  {r.is_escalated && (
                    <p className="text-xs text-orange-600 mt-1">Escalated</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleModerationAction(r.sender_id, 'warn')}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Warn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuspend(r.sender_id, 7)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Suspend 7d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuspend(r.sender_id, null)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Unsuspend
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShadowban(r.sender_id, true)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Shadowban
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShadowban(r.sender_id, false)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Unshadowban
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerationAction(r.sender_id, 'deactivate')}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Deactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerationAction(r.sender_id, 'reactivate')}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-gray-600"
                    >
                      Reactivate
                    </button>
                  </div>
                  {r.reason && (
                    <p className="text-xs text-gray-500 mt-1">Reason: {r.reason}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  );
}
