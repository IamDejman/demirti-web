'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/app/components/admin';
import { DEFAULT_SPONSORED_COHORT } from '@/lib/config';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SendBootcampWelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const selectAllRef = useRef(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const [appsRes, sponsoredRes] = await Promise.all([
        fetch('/api/admin/applications?track=Data%20Science', { headers: getAuthHeaders() }),
        fetch(`/api/admin/sponsored-applications?reviewStatus=accepted&cohortName=${encodeURIComponent(DEFAULT_SPONSORED_COHORT)}`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const appsData = await appsRes.json();
      const sponsoredData = await sponsoredRes.json();

      const list = [];
      const seenEmails = new Set();

      if (appsData.success && appsData.applications) {
        for (const app of appsData.applications) {
          const email = (app.email || '').trim().toLowerCase();
          if (email && email.includes('@') && !seenEmails.has(email)) {
            seenEmails.add(email);
            list.push({
              email,
              name: [app.first_name, app.last_name].filter(Boolean).join(' ').trim() || '—',
              status: app.status === 'paid' ? 'Paid' : 'Unpaid',
            });
          }
        }
      }

      if (sponsoredData.success && sponsoredData.applications) {
        const confirmed = sponsoredData.applications.filter((s) => s.confirmed_at != null);
        for (const s of confirmed) {
          const email = (s.email || '').trim().toLowerCase();
          if (email && email.includes('@') && !seenEmails.has(email)) {
            seenEmails.add(email);
            list.push({
              email,
              name: [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '—',
              status: 'Sponsored',
            });
          }
        }
      }

      setParticipants(list);
      setSelectedEmails(new Set());
    } catch {
      setMessage({ type: 'error', text: 'Failed to load participants' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (email) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedEmails(new Set(participants.map((p) => p.email)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        participants.length > 0 && selectedEmails.size > 0 && selectedEmails.size < participants.length;
    }
  }, [selectedEmails.size, participants.length]);

  const sendToSelected = () => sendEmails([...selectedEmails]);
  const sendToAll = () => sendEmails(participants.map((p) => p.email));

  const sendEmails = async (emails) => {
    if (!emails.length) {
      setMessage({ type: 'error', text: 'No recipients selected.' });
      return;
    }
    setMessage({ type: '', text: '' });
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/send-bootcamp-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const detail = data.failedCount > 0
          ? ` Sent ${data.sentCount}, ${data.failedCount} failed.`
          : '';
        setMessage({
          type: data.sentCount > 0 ? 'success' : 'info',
          text: data.message + detail,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send emails' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while sending emails' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedEmails.size;

  return (
    <div className="admin-dashboard admin-content-area">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Send Email"
          description="Send bootcamp welcome emails to Data Science participants."
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading...</p>
          </div>
        ) : (
          <>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e1e4e8',
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 1fr 120px',
                  gap: '1rem',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#666',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={participants.length > 0 && selectedEmails.size === participants.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all"
                    style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#0066cc' }}
                  />
                </label>
                <span>Name</span>
                <span>Email</span>
                <span>Status</span>
              </div>
              {participants.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No participants found.
                </div>
              ) : (
                participants.map((p) => {
                  const isChecked = selectedEmails.has(p.email);
                  return (
                  <div
                    key={p.email}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #e1e4e8',
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 1fr 120px',
                      gap: '1rem',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelect(p.email)}
                      style={{
                        width: 20,
                        height: 20,
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={isChecked ? 'Deselect' : 'Select'}
                    >
                      {isChecked ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="16" height="16" rx="3" fill="#0066cc" stroke="#0066cc" />
                          <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="16" height="16" rx="3" fill="none" stroke="#999" />
                        </svg>
                      )}
                    </button>
                    <span style={{ color: '#1a1a1a' }}>{p.name}</span>
                    <span style={{ color: '#666' }}>{p.email}</span>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        backgroundColor:
                          p.status === 'Paid'
                            ? '#e8f5e9'
                            : p.status === 'Sponsored'
                              ? '#e3f2fd'
                              : '#fff3cd',
                        color:
                          p.status === 'Paid'
                            ? '#1b5e20'
                            : p.status === 'Sponsored'
                              ? '#0d47a1'
                              : '#856404',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                  );
                })
              )}
            </div>

            {message.text && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  backgroundColor:
                    message.type === 'success'
                      ? '#e8f5e9'
                      : message.type === 'error'
                        ? '#ffebee'
                        : '#e3f2fd',
                  color:
                    message.type === 'success'
                      ? '#1b5e20'
                      : message.type === 'error'
                        ? '#c62828'
                        : '#0d47a1',
                }}
              >
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={sendToSelected}
                disabled={isSubmitting || selectedCount === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: selectedCount === 0 || isSubmitting ? '#999' : '#0066cc',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedCount === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Sending...' : `Send to selected (${selectedCount})`}
              </button>
              <button
                type="button"
                onClick={sendToAll}
                disabled={isSubmitting || participants.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor:
                    participants.length === 0 || isSubmitting ? '#999' : '#00c896',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: participants.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Sending...' : `Send to all (${participants.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
