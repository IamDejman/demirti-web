'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminStatsGrid, AdminButton } from '../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);


  useEffect(() => {
    loadData();
    // Note: loadData is intentionally excluded from deps to prevent infinite loops
  }, [selectedTrack, selectedStatus]);


  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications
      const trackParam = selectedTrack !== 'all' ? `&track=${encodeURIComponent(selectedTrack)}` : '';
      const statusParam = selectedStatus !== 'all' ? `&status=${selectedStatus}` : '';
      const appsResponse = await fetch(`/api/admin/applications?${trackParam}${statusParam}`, {
        headers: getAuthHeaders(),
      });
      const appsData = await appsResponse.json();
      
      if (appsData.success) {
        setApplications(appsData.applications);
        setStats(appsData.stats);
      }


    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format payment amounts - these are stored in kobo (from Paystack)
  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const getUniqueTracks = () => {
    const tracks = new Set(applications.map(app => app.track_name));
    return Array.from(tracks);
  };

  return (
    <div className="admin-dashboard admin-dashboard-content">
        <div className="container admin-cohorts-wrap">
          <AdminPageHeader
            title="Applications"
            description="View and manage bootcamp applications, payments, and revenue."
          />

          {loading ? (
            <div className="admin-loading admin-loading-center">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {stats && (
                <AdminStatsGrid
                  items={[
                    { label: 'Total Applications', value: stats.total, accent: 'primary' },
                    { label: 'Paid', value: stats.paid, accent: 'secondary' },
                    { label: 'Pending Payment', value: stats.pending, accent: 'warning' },
                    { label: 'Total Revenue', value: stats.totalRevenue, prefix: '₦', accent: 'success' },
                  ]}
                />
              )}

              <div className="admin-card admin-filters">
                <label>Filter by Track:</label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="all">All Tracks</option>
                  {getUniqueTracks().map(track => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>

                <label>Filter by Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>

                <AdminButton variant="primary" onClick={loadData}>
                  Refresh
                </AdminButton>
              </div>

              <div className="admin-card admin-table-container">
                <h2 className="admin-card-title">Applications ({applications.length})</h2>

                {applications.length === 0 ? (
                  <p className="admin-empty-state">No applications found</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr className="admin-table-thead-row">
                        <th className="admin-table-th">Name</th>
                        <th className="admin-table-th">Email</th>
                        <th className="admin-table-th">Phone</th>
                        <th className="admin-table-th">Track</th>
                        <th className="admin-table-th">Referral Source</th>
                        <th className="admin-table-th">Status</th>
                        <th className="admin-table-th">Amount</th>
                        <th className="admin-table-th">Payment Ref</th>
                        <th className="admin-table-th">Applied</th>
                        <th className="admin-table-th">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id} className="admin-table-tr">
                          <td className="admin-table-td">{app.first_name} {app.last_name}</td>
                          <td className="admin-table-td">{app.email}</td>
                          <td className="admin-table-td">{app.phone}</td>
                          <td className="admin-table-td">{app.track_name}</td>
                          <td className="admin-table-td admin-meta">{app.referral_source || 'N/A'}</td>
                          <td className="admin-table-td">
                            <span className={app.status === 'paid' ? 'admin-badge-status-success' : 'admin-badge-status-warning'}>
                              {app.status === 'paid' ? 'Paid' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="admin-table-td admin-table-td-strong">{app.amount ? formatCurrency(app.amount) : 'N/A'}</td>
                          <td className="admin-table-td admin-meta">{app.payment_reference || 'N/A'}</td>
                          <td className="admin-table-td admin-meta">{formatDate(app.created_at)}</td>
                          <td className="admin-table-td admin-meta">{app.paid_at ? formatDate(app.paid_at) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {stats && stats.byTrack && Object.keys(stats.byTrack).length > 0 && (
                <div className="admin-card admin-card-last admin-card-mt">
                  <h2 className="admin-card-title">Statistics by Track</h2>
                  <div className="admin-track-stats-grid">
                    {Object.entries(stats.byTrack).map(([trackName, trackStats]) => (
                      <div key={trackName} className="admin-track-stat-item">
                        <h3>{trackName}</h3>
                        <div className="admin-track-stat-row">
                          <p><strong>Total:</strong> {trackStats.total}</p>
                          <p className="paid"><strong>Paid:</strong> {trackStats.paid}</p>
                          <p className="pending"><strong>Pending:</strong> {trackStats.pending}</p>
                          <p className="revenue"><strong>Revenue:</strong> ₦{(trackStats.revenue / 100).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}

