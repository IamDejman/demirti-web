'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminButton } from '@/app/components/admin';
import { DEFAULT_SPONSORED_COHORT } from '@/lib/config';
import { getAuthHeaders } from '@/lib/authClient';
import { useToast } from '@/app/components/ToastProvider';

const STATUS_CONFIG = {
  Paid: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.2)' },
  Sponsored: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.2)' },
  Unpaid: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.2)' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Unpaid;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        fontSize: '0.6875rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {status}
    </span>
  );
}

function AvatarCircle({ name }) {
  const initials = name && name !== '\u2014'
    ? name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  return (
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
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function SendBootcampWelcomePage() {
  const router = useRouter();
  const { showToast } = useToast();
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
              name: [app.first_name, app.last_name].filter(Boolean).join(' ').trim() || '\u2014',
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
              name: [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '\u2014',
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

  useEffect(() => {
    if (message.type !== 'error' || !message.text) return;
    showToast({ type: 'error', message: message.text });
  }, [message, showToast]);

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
  const paidCount = participants.filter((p) => p.status === 'Paid').length;
  const sponsoredCount = participants.filter((p) => p.status === 'Sponsored').length;
  const unpaidCount = participants.filter((p) => p.status === 'Unpaid').length;

  const statCards = [
    { label: 'Total Participants', value: participants.length },
    { label: 'Paid', value: paidCount },
    { label: 'Sponsored', value: sponsoredCount },
    { label: 'Unpaid', value: unpaidCount },
  ];

  return (
    <div className="admin-dashboard admin-content-area">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Send Email"
          description="Send bootcamp welcome emails to Data Science participants."
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Participant list card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                marginBottom: '1.5rem',
                overflow: 'hidden',
              }}
            >
              {/* List header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={participants.length > 0 && selectedEmails.size === participants.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      aria-label="Select all"
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0052a3' }}
                    />
                  </label>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#6b7280',
                    }}
                  >
                    {selectedCount > 0 ? `${selectedCount} selected` : `${participants.length} participants`}
                  </span>
                </div>
              </div>

              {/* Participant rows */}
              {participants.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  No participants found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
                  {participants.map((p) => {
                    const isChecked = selectedEmails.has(p.email);
                    return (
                      <div
                        key={p.email}
                        onClick={() => toggleSelect(p.email)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.875rem',
                          padding: '0.875rem 1rem',
                          borderRadius: 8,
                          border: `1px solid ${isChecked ? '#0052a3' : '#e5e7eb'}`,
                          background: isChecked ? 'rgba(0, 82, 163, 0.03)' : '#fff',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          tabIndex={-1}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0052a3', flexShrink: 0 }}
                        />
                        <AvatarCircle name={p.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '0.125rem' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.email}
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Success/info message */}
            {message.text && message.type !== 'error' && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 12,
                  border: '1px solid',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  backgroundColor:
                    message.type === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                  borderColor:
                    message.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                  color:
                    message.type === 'success' ? '#059669' : '#2563eb',
                }}
              >
                {message.text}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <AdminButton
                variant="primary"
                onClick={sendToSelected}
                disabled={isSubmitting || selectedCount === 0}
              >
                {isSubmitting ? 'Sending...' : `Send to selected (${selectedCount})`}
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={sendToAll}
                disabled={isSubmitting || participants.length === 0}
              >
                {isSubmitting ? 'Sending...' : `Send to all (${participants.length})`}
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
