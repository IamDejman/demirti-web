'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';
import { getAuthHeaders } from '@/lib/authClient';

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.5rem',
};

const INPUT_STYLE = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.9375rem',
  color: 'var(--text-color)',
  background: '#fff',
  boxSizing: 'border-box',
};

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [email, setEmail] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadData = async () => {
    const [certRes, cohortRes] = await Promise.all([
      fetch('/api/admin/certificates', { headers: getAuthHeaders() }),
      fetch('/api/cohorts', { headers: getAuthHeaders() }),
    ]);
    const certData = await certRes.json();
    const cohortData = await cohortRes.json();
    if (certRes.ok && certData.certificates) setCertificates(certData.certificates);
    if (cohortRes.ok && cohortData.cohorts) setCohorts(cohortData.cohorts);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email.trim()) return;
    const res = await fetch('/api/admin/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email: email.trim(), cohortId: cohortId || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage('Certificate issued.');
      setEmail('');
      setCohortId('');
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to issue certificate');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/certificates/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminPageHeader
          title="Certificates"
          description="Issue completion certificates to students by email."
        />

        {message && (
          <div style={{
            ...CARD_STYLE,
            padding: '0.875rem 1rem',
            background: messageType === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            borderColor: messageType === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)',
            color: messageType === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: messageType === 'success' ? '#059669' : '#dc2626',
              flexShrink: 0,
            }} />
            {message}
          </div>
        )}

        {/* Issue certificate form */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}>Issue certificate</h3>
          <form onSubmit={handleIssue}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Student email</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Cohort (optional)</label>
                <select
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  style={INPUT_STYLE}
                >
                  <option value="">Select cohort</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.5rem',
                    background: 'var(--primary-color, #0052a3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Issue certificate
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Issued certificates list */}
        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}>Issued certificates</h3>

          {certificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.25rem' }}>No certificates issued yet</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Issue a certificate above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}
                >
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>
                      {cert.email}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>
                      {cert.certificate_number} -- {new Date(cert.issued_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    <a
                      href={`/api/certificates/${cert.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--primary-color, #0052a3)',
                        textDecoration: 'none',
                      }}
                    >
                      PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
