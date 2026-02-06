'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [email, setEmail] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [message, setMessage] = useState('');

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
      setMessage('Certificate issued.');
      setEmail('');
      setCohortId('');
      await loadData();
    } else {
      setMessage(data.error || 'Failed to issue certificate');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/certificates/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue certificate</h2>
          <form onSubmit={handleIssue} className="space-y-3">
            <input
              type="email"
              placeholder="Student email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select cohort (optional)</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
              Issue certificate
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issued certificates</h2>
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-500">No certificates issued yet.</p>
          ) : (
            <ul className="space-y-3">
              {certificates.map((cert) => (
                <li key={cert.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{cert.email}</p>
                    <div className="flex gap-3">
                      <a href={`/api/certificates/${cert.id}/pdf`} className="text-xs text-primary hover:underline">PDF</a>
                      <button type="button" onClick={() => handleDelete(cert.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {cert.certificate_number} · {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}
