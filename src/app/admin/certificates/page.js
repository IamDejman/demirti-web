'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
  AdminEmptyState,
} from '../../components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

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
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Certificates"
        description="Issue completion certificates to students by email."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title="Issue certificate">
        <form onSubmit={handleIssue} className="admin-form-section">
          <AdminFormField label="Student email">
            <input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField label="Cohort (optional)">
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select cohort</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </AdminFormField>
          <AdminButton type="submit" variant="primary">
            Issue certificate
          </AdminButton>
        </form>
      </AdminCard>

      <AdminCard title="Issued certificates">
        {certificates.length === 0 ? (
          <AdminEmptyState message="No certificates issued yet." description="Issue a certificate above." />
        ) : (
          <ul className="admin-list">
            {certificates.map((cert) => (
              <li key={cert.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{cert.email}</p>
                  <div className="admin-action-group">
                    <a
                      href={`/api/certificates/${cert.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-link admin-link-primary"
                    >
                      PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      className="admin-link admin-link-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  {cert.certificate_number} · {new Date(cert.issued_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
