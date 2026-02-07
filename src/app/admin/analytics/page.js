'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { AdminPageHeader } from '../../components/admin';

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
  const [lmsMetrics, setLmsMetrics] = useState(null);
  const [lmsTimeseries, setLmsTimeseries] = useState(null);
  const [lmsCohorts, setLmsCohorts] = useState([]);
  const [lmsFunnel, setLmsFunnel] = useState(null);
  const [lmsEvents, setLmsEvents] = useState([]);
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

  const fetchLmsMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/lms', { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setLmsMetrics(data.data);
    } catch {
      // ignore
    }
  }, [checkAuth]);

  const fetchLmsTimeseries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (customRange && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('days', String(queryDays));
      }
      const res = await fetch(`/api/admin/analytics/lms/timeseries?${params.toString()}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setLmsTimeseries(data.data);
    } catch {
      // ignore
    }
  }, [checkAuth, customRange, customStart, customEnd, queryDays]);

  const fetchLmsCohorts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/lms/cohorts', { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setLmsCohorts(data.cohorts || []);
    } catch {
      // ignore
    }
  }, [checkAuth]);

  const fetchLmsFunnel = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (customRange && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('days', String(queryDays));
      }
      const res = await fetch(`/api/admin/analytics/lms/funnel?${params.toString()}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setLmsFunnel(data.steps || []);
    } catch {
      // ignore
    }
  }, [checkAuth, customRange, customStart, customEnd, queryDays]);

  const fetchLmsEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (customRange && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('days', String(queryDays));
      }
      const res = await fetch(`/api/admin/analytics/lms/events?${params.toString()}`, { headers: getAuthHeaders() });
      if (checkAuth(res)) return;
      const data = await res.json();
      if (res.ok && data.success) setLmsEvents(data.events || []);
    } catch {
      // ignore
    }
  }, [checkAuth, customRange, customStart, customEnd, queryDays]);

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
      fetchLmsMetrics(),
      fetchLmsTimeseries(),
      fetchLmsCohorts(),
      fetchLmsFunnel(),
      fetchLmsEvents(),
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
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleLmsExport = async () => {
    setExporting(true);
    try {
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      const res = await fetch(`/api/admin/analytics/lms/export?start=${startStr}&end=${endStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lms-events-${startStr}-${endStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('LMS export failed');
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

  const buildLmsSeries = (data) => {
    if (!data) return [];
    const map = new Map();
    const addSeries = (rows, key) => {
      (rows || []).forEach((row) => {
        const day = row.day;
        if (!map.has(day)) map.set(day, { day });
        map.get(day)[key] = row.count;
      });
    };
    addSeries(data.enrollments, 'enrollments');
    addSeries(data.submissions, 'submissions');
    addSeries(data.completions, 'completions');
    addSeries(data.certificates, 'certificates');
    return Array.from(map.values()).sort((a, b) => new Date(a.day) - new Date(b.day));
  };

  const lmsSeries = buildLmsSeries(lmsTimeseries);

  if (loading && !overview) {
    return (
      <div className="admin-dashboard admin-content-area">
          <div className="container" style={{ maxWidth: 1400, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Loading analytics...</p>
          </div>
        </div>
    );
  }

  if (!loading && !overview) {
    return (
      <div className="admin-dashboard admin-content-area">
          <div className="container" style={{ maxWidth: 1400, margin: '0 auto' }}>
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
    );
  }

  const hasNoData = overview && overview.totalPageviews === 0 && overview.totalSessions === 0;

  return (
    <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {hasNoData && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1', fontSize: '0.9rem' }}>
              No data for this period yet. Data appears once visitors browse the site with tracking consent enabled (cookie banner).
            </div>
          )}
          <AdminPageHeader
            title="Analytics"
            description="Website and LMS analytics with customizable date ranges."
            actions={
              <div className="admin-action-group">
                {!customRange ? (
                  <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e1e4e8', width: 'auto' }}>
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
                <label className="admin-form-checkbox" style={{ marginBottom: 0 }}>
                  <input type="checkbox" checked={customRange} onChange={(e) => setCustomRange(e.target.checked)} />
                  <span>Custom range</span>
                </label>
                <label className="admin-form-checkbox" style={{ marginBottom: 0 }}>
                  <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
                  <span>Compare</span>
                </label>
                <button type="button" onClick={() => handleExport('events')} disabled={exporting} className="admin-btn admin-btn-secondary">
                  Export CSV
                </button>
                <button type="button" onClick={handleLmsExport} disabled={exporting} className="admin-btn admin-btn-secondary">
                  Export LMS events
                </button>
              </div>
            }
          />

          {lmsMetrics && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>LMS metrics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Active cohorts</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lmsMetrics.cohorts?.active ?? 0}</p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>Total: {lmsMetrics.cohorts?.total ?? 0}</p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Enrolled students</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lmsMetrics.enrolledStudents ?? 0}</p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Completion rate</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lmsMetrics.completion?.rate ?? 0}%</p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>
                    {lmsMetrics.completion?.completed ?? 0} / {lmsMetrics.completion?.total ?? 0}
                  </p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Average grade</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                    {lmsMetrics.avgScore ? lmsMetrics.avgScore.toFixed(1) : '—'}
                  </p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Submissions</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lmsMetrics.submissions ?? 0}</p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>Attendance</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lmsMetrics.attendance?.present ?? 0}</p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>Total: {lmsMetrics.attendance?.total ?? 0}</p>
                </div>
              </div>
              {Array.isArray(lmsMetrics.roles) && lmsMetrics.roles.length > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                  Roles: {lmsMetrics.roles.map((r) => `${r.role}: ${r.count}`).join(' · ')}
                </div>
              )}
            </div>
          )}

          {lmsSeries.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>LMS time-series</h2>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lmsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="enrollments" stroke="#0066cc" strokeWidth={2} />
                    <Line type="monotone" dataKey="submissions" stroke="#00c896" strokeWidth={2} />
                    <Line type="monotone" dataKey="completions" stroke="#ffc107" strokeWidth={2} />
                    <Line type="monotone" dataKey="certificates" stroke="#6f42c1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {Array.isArray(lmsFunnel) && lmsFunnel.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Completion funnel</h2>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lmsFunnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0066cc" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {Array.isArray(lmsCohorts) && lmsCohorts.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Cohort comparisons</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#666' }}>
                      <th style={{ paddingBottom: 8 }}>Cohort</th>
                      <th style={{ paddingBottom: 8 }}>Track</th>
                      <th style={{ paddingBottom: 8 }}>Enrolled</th>
                      <th style={{ paddingBottom: 8 }}>Completed</th>
                      <th style={{ paddingBottom: 8 }}>Completion %</th>
                      <th style={{ paddingBottom: 8 }}>Avg score</th>
                      <th style={{ paddingBottom: 8 }}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lmsCohorts.map((c) => {
                      const enrolled = Number(c.enrolled || 0);
                      const completed = Number(c.completed || 0);
                      const completionRate = enrolled ? Math.round((completed / enrolled) * 100) : 0;
                      const attendanceTotal = Number(c.attendance_total || 0);
                      const attendancePresent = Number(c.attendance_present || 0);
                      const attendanceRate = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 0' }}>{c.name}</td>
                          <td style={{ padding: '8px 0' }}>{c.track_name || '—'}</td>
                          <td style={{ padding: '8px 0' }}>{enrolled}</td>
                          <td style={{ padding: '8px 0' }}>{completed}</td>
                          <td style={{ padding: '8px 0' }}>{completionRate}%</td>
                          <td style={{ padding: '8px 0' }}>{c.avg_score ? Number(c.avg_score).toFixed(1) : '—'}</td>
                          <td style={{ padding: '8px 0' }}>{attendanceRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {Array.isArray(lmsEvents) && lmsEvents.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>LMS event counts</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {lmsEvents.map((ev) => (
                  <div key={ev.name} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #eee', background: '#fff' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>{ev.name}</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{ev.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
  );
}
