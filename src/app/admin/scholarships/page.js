'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState([]);
  const [scholarshipRecipients, setScholarshipRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load scholarships
      const scholarshipsResponse = await fetch('/api/admin/scholarships');
      const scholarshipsData = await scholarshipsResponse.json();
      
      if (scholarshipsData.success) {
        setScholarships(scholarshipsData.scholarships);
      }

      // Load scholarship recipients
      const recipientsResponse = await fetch('/api/admin/scholarship-recipients');
      const recipientsData = await recipientsResponse.json();
      
      if (recipientsData.success) {
        setScholarshipRecipients(recipientsData.recipientsByTrack);
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

  return (
    <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <AdminPageHeader
            title="Scholarships"
            description="Manage scholarship applications and recipients by track."
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Scholarship Status Cards */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
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

              {/* Scholarship Recipients List */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                  Scholarship Recipients
                </h2>
                
                {scholarshipRecipients.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No scholarship recipients yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {scholarshipRecipients.map((trackData) => (
                      <div key={trackData.trackName}>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '700', 
                          marginBottom: '1rem',
                          color: '#0066cc',
                          borderBottom: '2px solid #e1e4e8',
                          paddingBottom: '0.5rem'
                        }}>
                          {trackData.trackName} - {trackData.recipients.length} Recipient{trackData.recipients.length !== 1 ? 's' : ''}
                          <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '500', 
                            color: '#666',
                            marginLeft: '0.5rem'
                          }}>
                            ({Math.round(trackData.discountPercentage)}% discount)
                          </span>
                        </h3>
                        
                        {trackData.recipients.length === 0 ? (
                          <p style={{ color: '#666', fontStyle: 'italic' }}>
                            No recipients for this track yet
                          </p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid #e1e4e8', backgroundColor: '#f8f9fa' }}>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>#</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Name</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Email</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Phone</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Amount Paid</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Paid Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trackData.recipients.map((recipient, index) => (
                                  <tr key={recipient.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                                      {index + 1}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#1a1a1a', fontWeight: '600' }}>
                                      {recipient.firstName} {recipient.lastName}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#1a1a1a' }}>
                                      {recipient.email}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                                      {recipient.phone}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#00c896', fontWeight: '600' }}>
                                      {formatCurrency(recipient.amount)}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                                      {formatDate(recipient.paidAt)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
  );
}

