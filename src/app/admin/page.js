'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'scholarships'

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications
      const trackParam = selectedTrack !== 'all' ? `&track=${encodeURIComponent(selectedTrack)}` : '';
      const statusParam = selectedStatus !== 'all' ? `&status=${selectedStatus}` : '';
      const appsResponse = await fetch(`/api/admin/applications?${trackParam}${statusParam}`);
      const appsData = await appsResponse.json();
      
      if (appsData.success) {
        setApplications(appsData.applications);
        setStats(appsData.stats);
      }

      // Load scholarships
      const scholarshipsResponse = await fetch('/api/admin/scholarships');
      const scholarshipsData = await scholarshipsResponse.json();
      
      if (scholarshipsData.success) {
        setScholarships(scholarshipsData.scholarships);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const getUniqueTracks = () => {
    const tracks = new Set(applications.map(app => app.track_name));
    return Array.from(tracks);
  };

  return (
    <main>
      <Navbar />
      <div style={{ 
        marginTop: '140px', 
        padding: '2rem',
        backgroundColor: '#f8f9fa',
        minHeight: 'calc(100vh - 140px)'
      }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '2rem',
            color: '#1a1a1a'
          }}>
            Admin Dashboard
          </h1>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid #e1e4e8'
          }}>
            <button
              onClick={() => setActiveTab('applications')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'applications' ? '#0066cc' : 'transparent',
                color: activeTab === 'applications' ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('scholarships')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'scholarships' ? '#0066cc' : 'transparent',
                color: activeTab === 'scholarships' ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Scholarships
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading...</p>
            </div>
          ) : activeTab === 'applications' ? (
            <>
              {/* Statistics Cards */}
              {stats && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #0066cc'
                  }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Total Applications
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                      {stats.total}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #00c896'
                  }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Paid
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: '#00c896', margin: 0 }}>
                      {stats.paid}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #ffc107'
                  }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Pending Payment
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffc107', margin: 0 }}>
                      {stats.pending}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #28a745'
                  }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Total Revenue
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: '#28a745', margin: 0 }}>
                      ₦{stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <label style={{ fontWeight: '600', color: '#666' }}>Filter by Track:</label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e1e4e8',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">All Tracks</option>
                  {getUniqueTracks().map(track => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>

                <label style={{ fontWeight: '600', color: '#666', marginLeft: '1rem' }}>Filter by Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e1e4e8',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  onClick={loadData}
                  style={{
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginLeft: 'auto'
                  }}
                >
                  Refresh
                </button>
              </div>

              {/* Applications Table */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflowX: 'auto'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                  Applications ({applications.length})
                </h2>
                
                {applications.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No applications found
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e1e4e8' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Phone</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Track</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Payment Ref</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Applied</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#666' }}>Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '1rem', color: '#1a1a1a' }}>
                            {app.first_name} {app.last_name}
                          </td>
                          <td style={{ padding: '1rem', color: '#1a1a1a' }}>{app.email}</td>
                          <td style={{ padding: '1rem', color: '#1a1a1a' }}>{app.phone}</td>
                          <td style={{ padding: '1rem', color: '#1a1a1a' }}>{app.track_name}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              backgroundColor: app.status === 'paid' ? '#d4edda' : '#fff3cd',
                              color: app.status === 'paid' ? '#155724' : '#856404'
                            }}>
                              {app.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#1a1a1a', fontWeight: '600' }}>
                            {app.amount ? formatCurrency(app.amount) : 'N/A'}
                          </td>
                          <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                            {app.payment_reference || 'N/A'}
                          </td>
                          <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                            {formatDate(app.created_at)}
                          </td>
                          <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                            {app.paid_at ? formatDate(app.paid_at) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Track Statistics */}
              {stats && stats.byTrack && Object.keys(stats.byTrack).length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginTop: '2rem'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                    Statistics by Track
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {Object.entries(stats.byTrack).map(([trackName, trackStats]) => (
                      <div key={trackName} style={{
                        padding: '1.5rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e1e4e8'
                      }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                          {trackName}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <p style={{ margin: 0, color: '#666' }}>
                            <strong>Total:</strong> {trackStats.total}
                          </p>
                          <p style={{ margin: 0, color: '#00c896' }}>
                            <strong>Paid:</strong> {trackStats.paid}
                          </p>
                          <p style={{ margin: 0, color: '#ffc107' }}>
                            <strong>Pending:</strong> {trackStats.pending}
                          </p>
                          <p style={{ margin: 0, color: '#28a745', fontWeight: '600' }}>
                            <strong>Revenue:</strong> ₦{trackStats.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Scholarships Tab */
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                Scholarship Status by Track
              </h2>
              
              {scholarships.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No scholarship data available
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {scholarships.map((scholarship) => (
                    <div key={scholarship.trackName} style={{
                      padding: '1.5rem',
                      backgroundColor: scholarship.available ? '#e8f5e9' : '#fff3cd',
                      borderRadius: '12px',
                      border: `2px solid ${scholarship.available ? '#00c896' : '#ffc107'}`,
                      borderLeft: `6px solid ${scholarship.available ? '#00c896' : '#ffc107'}`
                    }}>
                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        marginBottom: '1rem',
                        color: '#1a1a1a'
                      }}>
                        {scholarship.trackName}
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666', fontWeight: '600' }}>Scholarship Limit:</span>
                          <span style={{ color: '#1a1a1a', fontWeight: '700', fontSize: '1.1rem' }}>
                            {scholarship.limit}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666', fontWeight: '600' }}>Used:</span>
                          <span style={{ color: '#1a1a1a', fontWeight: '700', fontSize: '1.1rem' }}>
                            {scholarship.count} / {scholarship.limit}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666', fontWeight: '600' }}>Remaining:</span>
                          <span style={{ 
                            color: scholarship.available ? '#00c896' : '#dc3545',
                            fontWeight: '700',
                            fontSize: '1.25rem'
                          }}>
                            {scholarship.remaining}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666', fontWeight: '600' }}>Discount:</span>
                          <span style={{ color: '#1a1a1a', fontWeight: '700' }}>
                            {Math.round(scholarship.discountPercentage)}%
                          </span>
                        </div>
                        
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: scholarship.available ? '#c8e6c9' : '#ffe082',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <p style={{ 
                            margin: 0, 
                            fontWeight: '600',
                            color: scholarship.available ? '#2e7d32' : '#f57c00'
                          }}>
                            {scholarship.available 
                              ? `✅ ${scholarship.remaining} scholarship${scholarship.remaining !== 1 ? 's' : ''} available`
                              : '❌ All scholarships taken'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

