'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 365 days', days: 365 },
];

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getDateRange(days, _customStart, _customEnd) {
  const end = new Date();
  const start = new Date();
  if (days === 0) {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, days: 1 };
  }
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, days };
}

const COLORS = ['#0066cc', '#00c896', '#ffc107', '#28a745', '#dc3545', '#6f42c1', '#fd7e14'];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [customRange, setCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [compare, setCompare] = useState(false);
  const [overview, setOverview] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [pages, setPages] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [audience, setAudience] = useState(null);
  const [funnels, setFunnels] = useState([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState(null);
  const [funnelPerf, setFunnelPerf] = useState(null);
  const [goalsPerf, setGoalsPerf] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [realtimeOpen, setRealtimeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const lastFetchKeyRef = useRef('');

  const { start, end, days: rangeDays } = customRange && customStart && customEnd
    ? (() => {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e, days: Math.ceil((e - s) / (24 * 60 * 60 * 1000)) };
      })()
    : getDateRange(days);

  const queryDays = rangeDays || 30;

  const checkAuth = useCallback((res) => {
    if (res.status === 401) {
      router.push('/admin/login');
      return true;
    }
    return false;
  }, [router]);

  const fetchOverview = useCallback(async () => {
    try {
      const params = new URLSearchParams({ compare: String(compare) });
      if (customRange && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('days', String(queryDays));
      }
      const res = await fetch(`/api/admin/analytics/overview?${params}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setOverview(data.data);
    } catch {
      // e.g. ERR_BLOCKED_BY_CONTENT_BLOCKER or network error; avoid uncaught rejection
    }
  }, [queryDays, compare, customRange, customStart, customEnd, checkAuth]);

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/realtime', { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setRealtime(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [checkAuth]);

  const fetchTraffic = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/traffic?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setTraffic(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/pages?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setPages(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  const fetchEngagement = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/engagement?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setEngagement(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  const fetchAudience = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/audience?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setAudience(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  const fetchFunnels = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/funnels', { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setFunnels(data.funnels || []);
    } catch {
      // e.g. content blocker or network error
    }
  }, [checkAuth]);

  const fetchFunnelPerf = useCallback(async () => {
    if (!selectedFunnelId) { setFunnelPerf(null); return; }
    try {
      const res = await fetch(`/api/admin/analytics/funnels/${selectedFunnelId}?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setFunnelPerf(data.data);
    } catch {
      setFunnelPerf(null);
    }
  }, [selectedFunnelId, queryDays, checkAuth]);

  const fetchGoalsPerf = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/goals?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setGoalsPerf(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  // Use event-log path; /api/admin/analytics/events is often blocked by content blockers (ERR_BLOCKED_BY_CONTENT_BLOCKER).
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics/event-log?days=${queryDays}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setEventsData(data.data);
    } catch {
      // e.g. content blocker or network error
    }
  }, [queryDays, checkAuth]);

  // Depend only on primitive values; guard so we only run fetches once per unique deps (avoids 5k+ loops from re-runs).
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') !== 'true') {
      router.push('/admin/login');
      return;
    }
    const fetchKey = `${queryDays}-${compare}-${customRange}-${customStart}-${customEnd}`;
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    setLoading(true);
    Promise.all([
      fetchOverview(),
      fetchTraffic(),
      fetchPages(),
      fetchEngagement(),
      fetchAudience(),
      fetchFunnels(),
      fetchGoalsPerf(),
      fetchEvents(),
    ]).finally(() => setLoading(false));
  }, [queryDays, compare, customRange, customStart, customEnd]);

  useEffect(() => {
    if (selectedFunnelId) fetchFunnelPerf();
    else setFunnelPerf(null);
  }, [selectedFunnelId, queryDays]);

  useEffect(() => {
    if (!realtimeOpen) return;
    fetchRealtime();
    const t = setInterval(fetchRealtime, 10000);
    return () => clearInterval(t);
  }, [realtimeOpen]);

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      const res = await fetch(`/api/admin/analytics/export?type=${type}&start=${startStr}&end=${endStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type}-${startStr}-${endStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
  const sectionStyle = { ...cardStyle, marginBottom: '1.5rem' };

  const pctChange = (curr, prev) => {
    if (prev == null || prev === 0) return null;
    return (((curr - prev) / prev) * 100).toFixed(1);
  };

  if (loading && !overview) {
    return (
      <main className="admin-with-fixed-nav">
        <AdminNavbar />
        <div className="admin-dashboard admin-content-area">
          <div className="container" style={{ maxWidth: 1400, margin: '0 auto', paddingTop: 100 }}>
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Loading analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!loading && !overview) {
    return (
      <main className="admin-with-fixed-nav">
        <AdminNavbar />
        <div className="admin-dashboard admin-content-area">
          <div className="container" style={{ maxWidth: 1400, margin: '0 auto', paddingTop: 100 }}>
            <div style={{ ...cardStyle, maxWidth: 480, margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Analytics couldn’t load</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                Your session may have expired. Log out and log in again, then open Analytics.
              </p>
              <button
                type="button"
                onClick={() => router.push('/admin/login')}
                style={{ padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const hasNoData = overview && overview.totalPageviews === 0 && overview.totalSessions === 0;

  return (
    <main className="admin-with-fixed-nav">
      <AdminNavbar />
      <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: 1400, margin: '0 auto', paddingTop: 100 }}>
          {hasNoData && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1', fontSize: '0.9rem' }}>
              No data for this period yet. Data appears once visitors browse the site with tracking consent enabled (cookie banner).
            </div>
          )}
          <div className="admin-page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
            <h1 className="admin-page-title">Analytics</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {!customRange ? (
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e1e4e8' }}>
                  {DATE_PRESETS.map((p) => (
                    <option key={p.days} value={p.days}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e1e4e8' }} />
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e1e4e8' }} />
                </span>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={customRange} onChange={(e) => setCustomRange(e.target.checked)} />
                Custom range
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
                Compare
              </label>
              <button type="button" onClick={() => handleExport('events')} disabled={exporting} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e1e4e8', cursor: 'pointer' }}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Real-time */}
          <div style={sectionStyle}>
            <button type="button" onClick={() => setRealtimeOpen(!realtimeOpen)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {realtimeOpen ? '▼' : '▶'} Real-time
            </button>
            {realtimeOpen && realtime && (
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div><strong>Active now</strong>: {realtime.activeCount}</div>
                <div>
                  <strong>By page</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>{realtime.activeByPage?.slice(0, 5).map((r, i) => <li key={i}>{r.page}: {r.count}</li>) || []}</ul>
                </div>
                <div>
                  <strong>Last 20 events</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20, maxHeight: 200, overflow: 'auto' }}>{realtime.recentEvents?.map((e, i) => <li key={i}>{e.type} {e.name} – {new Date(e.created_at).toLocaleTimeString()}</li>) || []}</ul>
                </div>
              </div>
            )}
          </div>

          {/* Overview cards */}
          {overview && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Pageviews', value: overview.totalPageviews, prev: overview.previous?.totalPageviews, color: '#0066cc' },
                { label: 'Unique visitors', value: overview.uniqueVisitors, prev: overview.previous?.uniqueVisitors, color: '#00c896' },
                { label: 'Sessions', value: overview.totalSessions, prev: overview.previous?.totalSessions, color: '#ffc107' },
                { label: 'Bounce rate', value: `${(overview.bounceRate * 100).toFixed(1)}%`, prev: overview.previous ? (overview.previous.bounceRate * 100).toFixed(1) + '%' : null, color: '#6f42c1' },
                { label: 'Avg session', value: `${Math.round(overview.avgSessionDuration)}s`, prev: overview.previous ? `${Math.round(overview.previous.avgSessionDuration)}s` : null, color: '#28a745' },
                { label: 'Goal completions', value: overview.goalCompletions, prev: overview.previous?.goalCompletions, color: '#dc3545' },
              ].map((item, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${item.color}` }}>
                  <h3 style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>{item.label}</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{item.value}</p>
                  {compare && item.prev != null && typeof item.value === 'number' && (
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>Prev: {item.prev} ({pctChange(item.value, item.prev)}%)</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Traffic */}
          {traffic && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Traffic sources</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
                {traffic.byChannel?.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={traffic.byChannel} dataKey="pageviews" nameKey="channel" cx="50%" cy="50%" outerRadius={80} label={(e) => e.channel}>
                        {traffic.byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Source / Medium</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Pageviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traffic.bySourceMedium?.slice(0, 10).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.5rem' }}>{r.source} / {r.medium || '(none)'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pages */}
          {pages && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Pages</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Top by views</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>{pages.topByViews?.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: 4, wordBreak: 'break-all' }}>{r.url}</td><td style={{ padding: 4, textAlign: 'right' }}>{r.views}</td></tr>)}</tbody>
                  </table>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Top entry pages</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>{pages.entryPages?.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: 4, wordBreak: 'break-all' }}>{r.url}</td><td style={{ padding: 4, textAlign: 'right' }}>{r.sessions}</td></tr>)}</tbody>
                  </table>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Top exit pages</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>{pages.exitPages?.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: 4, wordBreak: 'break-all' }}>{r.url}</td><td style={{ padding: 4, textAlign: 'right' }}>{r.sessions}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Engagement */}
          {engagement && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Engagement</h2>
              {engagement.pageviewsByDay?.length > 0 && (
                <div style={{ height: 280, marginBottom: '1.5rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagement.pageviewsByDay.map((r) => ({ ...r, day: new Date(r.day).toLocaleDateString() }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="pageviews" stroke="#0066cc" name="Pageviews" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {engagement.scrollDepth?.length > 0 && (
                <div style={{ height: 220 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Scroll depth</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={engagement.scrollDepth.map((r) => ({ depth: `${r.depth}%`, count: r.count }))}>
                      <XAxis dataKey="depth" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00c896" name="Page exits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Audience */}
          {audience && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Audience</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {audience.newVsReturning?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>New vs returning</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={audience.newVsReturning.map((r) => ({ name: r.is_new_visitor ? 'New' : 'Returning', value: r.sessions }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                          {audience.newVsReturning.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {audience.byDevice?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Device</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={audience.byDevice.map((r) => ({ name: r.device_type, value: r.sessions }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                          {audience.byDevice.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Browsers</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>{audience.byBrowser?.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: 4 }}>{r.browser}</td><td style={{ padding: 4, textAlign: 'right' }}>{r.sessions}</td></tr>)}</tbody>
                  </table>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Countries</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>{audience.byCountry?.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: 4 }}>{r.country}</td><td style={{ padding: 4, textAlign: 'right' }}>{r.sessions}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Funnels */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Funnels</h2>
            <select value={selectedFunnelId || ''} onChange={(e) => setSelectedFunnelId(e.target.value ? Number(e.target.value) : null)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e1e4e8', marginBottom: '1rem' }}>
              <option value="">Select funnel</option>
              {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {funnelPerf && funnelPerf.steps?.length > 0 && (
              <div>
                <p style={{ marginBottom: 8 }}>Conversion rate: {(funnelPerf.conversionRate * 100).toFixed(1)}%</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {funnelPerf.steps.map((step, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '6px 12px', background: '#f0f2f5', borderRadius: 8 }}>{step.label}: {step.count}</span>
                      {i < funnelPerf.steps.length - 1 && <span style={{ color: '#666' }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Goals */}
          {goalsPerf && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Goals</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Goal</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Completions</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {goalsPerf.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{g.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{g.completions}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{(g.completionRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Event explorer */}
          {eventsData && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Event explorer</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Event</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsData.eventCounts?.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{r.name || '(unnamed)'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
