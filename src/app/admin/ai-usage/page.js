'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AdminPageHeader } from '../../components/admin';
import { getAuthHeaders } from '@/lib/authClient';

const RechartsLineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    const Wrapper = ({ data, dataKey, stroke }) => (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
    Wrapper.displayName = 'RechartsLineChart';
    return Wrapper;
  }),
  { ssr: false, loading: () => <div style={{ height: 260 }} /> }
);

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    const Wrapper = ({ data, height }) => (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="email" width={160} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#00c896" />
        </BarChart>
      </ResponsiveContainer>
    );
    Wrapper.displayName = 'RechartsBarChart';
    return Wrapper;
  }),
  { ssr: false, loading: () => <div style={{ height: 260 }} /> }
);

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.5rem',
};

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

export default function AdminAiUsagePage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/ai-usage?days=${days}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) setUsage(data.data);
    setLoading(false);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    load();
  }, [router, days]);

  const blockedTotal = usage?.blockedByDay?.reduce((acc, row) => acc + (row.count || 0), 0) || 0;

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminPageHeader
          title="AI Usage"
          description="View AI assistant usage metrics and analytics."
        />

        {/* Filter card */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>Range</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              padding: '0.625rem 0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '0.9375rem',
              color: 'var(--text-color)',
              background: '#fff',
              minWidth: 160,
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '30vh',
            gap: '1rem',
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #dbeafe',
              borderTopColor: 'var(--primary-color, #0052a3)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'var(--text-light)', fontSize: '0.9375rem' }}>Loading usage...</p>
          </div>
        ) : !usage ? (
          <div style={{ ...CARD_STYLE, textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.25rem' }}>No data available</p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Usage data will appear here.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}>
              {[
                { label: 'Total AI replies', value: usage.totals?.total_messages ?? 0, color: 'var(--primary-color, #0052a3)' },
                { label: 'Active users', value: usage.totals?.total_users ?? 0, color: '#059669' },
                { label: 'Blocked prompts', value: blockedTotal, color: '#dc3545' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '1.25rem',
                    border: '1px solid #e5e7eb',
                    borderTop: `3px solid ${stat.color}`,
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#6b7280',
                    }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-color)' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={CARD_STYLE}>
              <h3 style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#6b7280',
                marginBottom: '1rem',
                marginTop: 0,
              }}>Daily AI replies</h3>
              <RechartsLineChart data={usage.byDay || []} dataKey="count" stroke="#0066cc" />
            </div>

            <div style={CARD_STYLE}>
              <h3 style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#6b7280',
                marginBottom: '1rem',
                marginTop: 0,
              }}>Blocked prompts by day</h3>
              <RechartsLineChart data={usage.blockedByDay || []} dataKey="count" stroke="#dc3545" />
            </div>

            <div style={CARD_STYLE}>
              <h3 style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#6b7280',
                marginBottom: '1rem',
                marginTop: 0,
              }}>Top users</h3>
              <RechartsBarChart data={usage.topUsers || []} height={Math.max(260, (usage.topUsers?.length || 0) * 36)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
