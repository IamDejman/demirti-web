'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

const AVAILABILITY_CONFIG = {
  available: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Available' },
  full: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Full' },
};

function StatusBadge({ available, remaining }) {
  const config = available ? AVAILABILITY_CONFIG.available : AVAILABILITY_CONFIG.full;
  const label = available ? `${remaining} remaining` : config.label;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {label}
    </span>
  );
}

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
      const [scholarshipsRes, recipientsRes] = await Promise.all([
        fetch('/api/admin/scholarships'),
        fetch('/api/admin/scholarship-recipients'),
      ]);
      const [scholarshipsData, recipientsData] = await Promise.all([
        scholarshipsRes.json(),
        recipientsRes.json(),
      ]);
      if (scholarshipsData.success) setScholarships(scholarshipsData.scholarships);
      if (recipientsData.success) setScholarshipRecipients(recipientsData.recipientsByTrack);
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
    if (!amount) return '\u20A60';
    return `\u20A6${(amount / 100).toLocaleString()}`;
  };

  const totalScholarships = scholarships.reduce((sum, s) => sum + (s.limit || 0), 0);
  const totalUsed = scholarships.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalRemaining = scholarships.reduce((sum, s) => sum + (s.remaining || 0), 0);
  const totalRecipients = scholarshipRecipients.reduce((sum, t) => sum + (t.recipients?.length || 0), 0);

  return (
    <div className="admin-dashboard admin-content-area">
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', borderTop: '3px solid #2563eb', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Total Slots
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{totalScholarships}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', borderTop: '3px solid #059669', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Used
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{totalUsed}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', borderTop: '3px solid #f59e0b', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Remaining
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{totalRemaining}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', borderTop: '3px solid #8b5cf6', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Recipients
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{totalRecipients}</div>
              </div>
            </div>

            {/* Scholarship Status by Track */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '1rem' }}>
                Scholarship Status by Track
              </div>

              {scholarships.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No scholarship data available
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {scholarships.map((scholarship) => (
                    <div
                      key={scholarship.trackName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {/* Track icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {scholarship.trackName?.charAt(0)?.toUpperCase() || 'T'}
                      </div>

                      {/* Track name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                          {scholarship.trackName}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          {Math.round(scholarship.discountPercentage)}% discount
                        </div>
                      </div>

                      {/* Usage stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
                            Used
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                            {scholarship.count} / {scholarship.limit}
                          </div>
                        </div>
                        <StatusBadge available={scholarship.available} remaining={scholarship.remaining} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scholarship Recipients */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: '1rem' }}>
                Scholarship Recipients
              </div>

              {scholarshipRecipients.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No scholarship recipients yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {scholarshipRecipients.map((trackData) => (
                    <div key={trackData.trackName}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                          {trackData.trackName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                            {Math.round(trackData.discountPercentage)}% discount
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.2rem 0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 20,
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                          }}>
                            {trackData.recipients.length} recipient{trackData.recipients.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {trackData.recipients.length === 0 ? (
                        <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          No recipients for this track yet
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {trackData.recipients.map((recipient) => (
                            <div
                              key={recipient.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.875rem',
                                padding: '0.875rem 1rem',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb',
                              }}
                            >
                              {/* Avatar */}
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(recipient.firstName?.charAt(0) || '').toUpperCase()}
                                {(recipient.lastName?.charAt(0) || '').toUpperCase()}
                              </div>

                              {/* Name and email */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                  {recipient.firstName} {recipient.lastName}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                                  {recipient.email}
                                </div>
                              </div>

                              {/* Phone */}
                              <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
                                  Phone
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#111827' }}>
                                  {recipient.phone || 'N/A'}
                                </div>
                              </div>

                              {/* Amount */}
                              <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
                                  Paid
                                </div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#059669' }}>
                                  {formatCurrency(recipient.amount)}
                                </div>
                              </div>

                              {/* Date */}
                              <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
                                  Date
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                  {formatDate(recipient.paidAt)}
                                </div>
                              </div>
                            </div>
                          ))}
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
