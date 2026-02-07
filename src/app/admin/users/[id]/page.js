'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader } from '../../../components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminUserDetailPage({ params }) {
  const router = useRouter();
  const userId = params?.id;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [impersonations, setImpersonations] = useState([]);
  const [moderationActions, setModerationActions] = useState([]);
  const [submissions, setSubmissions] = useState(0);
  const [message, setMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const loadUser = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setEnrollments(data.enrollments || []);
      setCertificates(data.certificates || []);
      setImpersonations(data.impersonations || []);
      setModerationActions(data.moderationActions || []);
      setSubmissions(data.submissions || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (!userId) return;
    loadUser();
  }, [router, userId]);

  const handleResetPassword = async () => {
    setMessage('');
    setTempPassword('');
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      setTempPassword(data.tempPassword);
      setMessage('Temporary password generated.');
    } else {
      setMessage(data.error || 'Failed to reset password.');
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <AdminPageHeader
          breadcrumb={<Link href="/admin/users">← Users</Link>}
          title={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'User Details'}
          description={user?.email}
        />
        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

        {loading ? (
          <p className="text-gray-500 mt-4">Loading user...</p>
        ) : !user ? (
          <p className="text-gray-500 mt-4">User not found.</p>
        ) : (
          <>
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user.first_name || ''} {user.last_name || ''}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Role: {user.role} · Status: {user.is_active ? 'Active' : 'Inactive'}</p>
                  {user.suspended_until && (
                    <p className="text-xs text-red-600 mt-1">Suspended until: {new Date(user.suspended_until).toLocaleString()}</p>
                  )}
                  {user.is_shadowbanned && (
                    <p className="text-xs text-orange-600 mt-1">Shadowbanned</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                  <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                  {user.last_login_at && <span>Last login: {new Date(user.last_login_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/impersonation')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Impersonate
                </button>
              </div>
              {tempPassword && (
                <p className="text-sm text-gray-700 mt-3">Temp password: <span className="font-mono">{tempPassword}</span></p>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Enrollments</h3>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No enrollments.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {enrollments.map((e) => (
                      <li key={e.id} className="border-b border-gray-100 pb-2">
                        <p className="font-medium text-gray-900">{e.cohort_name}</p>
                        <p className="text-xs text-gray-500">Track: {e.track_name || '—'} · Status: {e.status}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
                <p className="text-sm text-gray-600 mt-2">Total submissions: {submissions}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
                {certificates.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No certificates issued.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {certificates.map((c) => (
                      <li key={c.id} className="border-b border-gray-100 pb-2">
                        <p className="font-medium text-gray-900">{c.certificate_number}</p>
                        <p className="text-xs text-gray-500">Issued: {new Date(c.issued_at).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Impersonation history</h3>
                {impersonations.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No impersonations.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {impersonations.map((imp) => (
                      <li key={imp.id} className="border-b border-gray-100 pb-2">
                        <p className="text-gray-700">Started: {new Date(imp.started_at).toLocaleString()}</p>
                        {imp.ended_at && <p className="text-xs text-gray-500">Ended: {new Date(imp.ended_at).toLocaleString()}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Moderation actions</h3>
              {moderationActions.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No moderation actions.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {moderationActions.map((action) => (
                    <li key={action.id} className="border-b border-gray-100 pb-2">
                      <p className="font-medium text-gray-900">{action.action}</p>
                      {action.reason && <p className="text-xs text-gray-500">Reason: {action.reason}</p>}
                      <p className="text-xs text-gray-500">
                        {action.actor_email || 'Admin'} · {new Date(action.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
  );
}
