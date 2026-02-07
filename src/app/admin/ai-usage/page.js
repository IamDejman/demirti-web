'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  AdminPageHeader,
  AdminCard,
  AdminStatsGrid,
  AdminFormField,
  AdminEmptyState,
} from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

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

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="AI Usage"
        description="View AI assistant usage metrics and analytics."
      />

      <AdminCard>
        <AdminFormField label="Range">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={inputClass}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </AdminFormField>
      </AdminCard>

      {loading ? (
        <p className="admin-loading">Loading usage...</p>
      ) : !usage ? (
        <AdminCard>
          <AdminEmptyState message="No data available." description="Usage data will appear here." />
        </AdminCard>
      ) : (
        <>
          <AdminStatsGrid
            items={[
              { label: 'Total AI replies', value: usage.totals?.total_messages ?? 0, color: 'var(--primary-color)' },
              { label: 'Active users', value: usage.totals?.total_users ?? 0, color: 'var(--secondary-color)' },
              {
                label: 'Blocked prompts',
                value: usage.blockedByDay?.reduce((acc, row) => acc + (row.count || 0), 0) || 0,
                color: '#dc3545',
              },
            ]}
          />

          <AdminCard title="Daily AI replies">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={usage.byDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0066cc" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard title="Blocked prompts by day">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={usage.blockedByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#dc3545" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard title="Top users">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height={Math.max(260, (usage.topUsers?.length || 0) * 36)}>
                <BarChart data={usage.topUsers || []} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="email" width={160} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00c896" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
