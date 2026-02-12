'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminMessage,
  AdminEmptyState,
} from '../../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

function formatRole(r) {
  if (!r) return '';
  return String(r).charAt(0).toUpperCase() + String(r).slice(1).toLowerCase();
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [impersonations, setImpersonations] = useState([]);
  const [moderationActions, setModerationActions] = useState([]);
  const [submissions, setSubmissions] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
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
      setMessageType('success');
      setMessage('Temporary password generated.');
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to reset password.');
    }
  };

  if (!userId) {
    return null;
  }

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
    : 'User Details';
  const initials = user
    ? [user.first_name, user.last_name]
        .filter(Boolean)
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || '?'
    : '…';

  return (
    <div className="admin-dashboard admin-dashboard-content admin-user-detail">
      <AdminPageHeader
        breadcrumb={
          <Link href="/admin/users" className="admin-link admin-link-primary">
            ← Users
          </Link>
        }
        title={displayName}
        description={user?.email}
      />

      {message && (
        <AdminMessage type={messageType}>{message}</AdminMessage>
      )}

      {loading ? (
        <div className="admin-user-detail-loading">
          <div className="admin-user-detail-loading-spinner" aria-hidden />
          <p className="admin-form-hint">Loading user...</p>
        </div>
      ) : !user ? (
        <AdminCard>
          <AdminEmptyState
            message="User not found"
            description="This user may have been deleted or the link is incorrect."
            action={
              <AdminButton variant="secondary" onClick={() => router.push('/admin/users')}>
                Back to users
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <>
          {/* Profile header */}
          <div className="admin-user-detail-profile">
            <div className="admin-user-detail-avatar" aria-hidden>
              {initials}
            </div>
            <div className="admin-user-detail-profile-main">
              <h1 className="admin-user-detail-name">{displayName}</h1>
              <p className="admin-user-detail-email">{user.email}</p>
              <div className="admin-user-detail-badges">
                <span
                  className={`admin-user-detail-badge admin-user-detail-badge-role ${
                    user.role === 'admin' ? 'admin-user-detail-badge-admin' : ''
                  }`}
                >
                  {formatRole(user.role)}
                </span>
                <span
                  className={`admin-user-detail-badge ${
                    user.is_active ? 'admin-user-detail-badge-active' : 'admin-user-detail-badge-inactive'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                {user.suspended_until && (
                  <span className="admin-user-detail-badge admin-user-detail-badge-warn">
                Suspended until {new Date(user.suspended_until).toLocaleDateString()}
              </span>
                )}
                {user.is_shadowbanned && (
                  <span className="admin-user-detail-badge admin-user-detail-badge-warn">Shadowbanned</span>
                )}
              </div>
              <div className="admin-user-detail-meta">
                <span>Created {new Date(user.created_at).toLocaleDateString()}</span>
                {user.last_login_at && (
                  <span>Last login {new Date(user.last_login_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="admin-user-detail-actions">
              <AdminButton variant="primary" onClick={handleResetPassword}>
                Reset password
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => router.push('/admin/impersonation')}
              >
                Impersonate
              </AdminButton>
            </div>
          </div>

          {tempPassword && (
            <div className="admin-user-detail-temp-password">
              <span className="admin-form-label">Temporary password:</span>
              <code className="admin-user-detail-temp-code">{tempPassword}</code>
            </div>
          )}

          {/* Content grid */}
          <div className="admin-user-detail-grid">
            <AdminCard title="Enrollments">
              {enrollments.length === 0 ? (
                <AdminEmptyState message="No enrollments" description="User is not enrolled in any cohort." />
              ) : (
                <ul className="admin-list">
                  {enrollments.map((e) => (
                    <li key={e.id} className="admin-list-item">
                      <p className="admin-list-item-title">{e.cohort_name}</p>
                      <p className="admin-list-item-meta">
                        Track: {e.track_name || '—'} · Status: {formatRole(e.status)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Assignments">
              <div className="admin-user-detail-stat">
                <span className="admin-user-detail-stat-value">{submissions}</span>
                <span className="admin-list-item-meta">Total submissions</span>
              </div>
            </AdminCard>

            <AdminCard title="Certificates">
              {certificates.length === 0 ? (
                <AdminEmptyState message="No certificates" description="No certificates issued yet." />
              ) : (
                <ul className="admin-list">
                  {certificates.map((c) => (
                    <li key={c.id} className="admin-list-item">
                      <p className="admin-list-item-title">{c.certificate_number}</p>
                      <p className="admin-list-item-meta">
                        Issued {new Date(c.issued_at).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Impersonation history">
              {impersonations.length === 0 ? (
                <AdminEmptyState message="None" description="No admin impersonations recorded." />
              ) : (
                <ul className="admin-list">
                  {impersonations.map((imp) => (
                    <li key={imp.id} className="admin-list-item">
                      <p className="admin-list-item-title">
                        Started {new Date(imp.started_at).toLocaleString()}
                      </p>
                      {imp.ended_at && (
                        <p className="admin-list-item-meta">
                          Ended {new Date(imp.ended_at).toLocaleString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <AdminCard title="Moderation actions">
            {moderationActions.length === 0 ? (
              <AdminEmptyState message="No moderation actions" description="No actions recorded for this user." />
            ) : (
              <ul className="admin-list">
                {moderationActions.map((action) => (
                  <li key={action.id} className="admin-list-item">
                    <p className="admin-list-item-title">{formatRole(action.action)}</p>
                    {action.reason && (
                      <p className="admin-list-item-body">Reason: {action.reason}</p>
                    )}
                    <p className="admin-list-item-meta">
                      {action.actor_email || 'Admin'} · {new Date(action.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </>
      )}
    </div>
  );
}
