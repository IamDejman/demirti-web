'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadAnalytics();
  }, [router, days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setData(null);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const sectionStyle = {
    ...cardStyle,
    marginBottom: '1.5rem',
  };

  return (
    <main>
      <AdminNavbar />
      <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
              Analytics
            </h1>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#666' }}>
              Last
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #e1e4e8',
                  fontSize: '1rem',
                }}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading analytics...</p>
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>No data or error loading analytics.</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ ...cardStyle, borderLeft: '4px solid #0066cc' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Pageviews
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                    {data.summary?.totalPageviews ?? 0}
                  </p>
                </div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #00c896' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Events
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#00c896', margin: 0 }}>
                    {data.summary?.totalEvents ?? 0}
                  </p>
                </div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #ffc107' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    App started
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffc107', margin: 0 }}>
                    {data.funnel?.started ?? 0}
                  </p>
                </div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #28a745' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Payments
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#28a745', margin: 0 }}>
                    {data.funnel?.completed ?? 0}
                  </p>
                </div>
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                  Pageviews by day
                </h2>
                {data.pageViewsByDay?.length ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Day</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#666' }}>Pageviews</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pageViewsByDay.map((row) => (
                          <tr key={row.day} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a' }}>
                              {new Date(row.day).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{row.pageviews}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#666' }}>No pageview data in this range.</p>
                )}
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                  Top pages
                </h2>
                {data.topPages?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>URL</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#666' }}>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '0.75rem', color: '#1a1a1a', wordBreak: 'break-all' }}>{row.url || '(unknown)'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{row.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#666' }}>No top pages in this range.</p>
                )}
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                  Application funnel
                </h2>
                <p style={{ marginBottom: '0.5rem', color: '#666' }}>
                  Started: <strong>{data.funnel?.started ?? 0}</strong> → Completed (payment): <strong>{data.funnel?.completed ?? 0}</strong>
                </p>
                <p style={{ color: '#1a1a1a', fontWeight: '600' }}>
                  Conversion rate: {data.funnel?.started ? ((data.funnel.conversionRate ?? 0) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                  Event counts
                </h2>
                {data.eventCounts?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Event</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#666' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.eventCounts.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '0.75rem', color: '#1a1a1a' }}>{row.name || '(unnamed)'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#666' }}>No events in this range.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
