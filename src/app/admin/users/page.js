'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AdminPageHeader,
  AdminFormField,
  AdminButton,
  AdminMessage,
} from '../../components/admin';
import { useToast } from '../../components/ToastProvider';

import { getAuthHeaders } from '@/lib/authClient';

const ROLE_OPTIONS = ['student', 'facilitator', 'alumni', 'admin', 'guest'];

function formatRoleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

const STATUS_CONFIG = {
  active: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Active' },
  inactive: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Inactive' },
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: '0.875rem',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.375rem',
  display: 'block',
};

const cardContainerStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  padding: '1.25rem',
  marginBottom: '1rem',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState('student');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const initialLoadDone = useRef(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createRole, setCreateRole] = useState('student');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadUsers = async (resetOffset = false, overrideOffset = null) => {
    const nextOffset = overrideOffset !== null ? overrideOffset : (resetOffset ? 0 : offset);
    setLoading(true);
    const params = new URLSearchParams({
      q: query.trim(),
      role: roleFilter,
      status: statusFilter,
      offset: String(nextOffset),
      limit: String(limit),
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (resetOffset) setOffset(0);
      if (overrideOffset !== null) setOffset(overrideOffset);
    }
    setLoading(false);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadUsers(true);
  }, [router]);

  const toggleSelectAll = (checked) => {
    if (checked) {
      const next = {};
      users.forEach((u) => { next[u.id] = true; });
      setSelected(next);
    } else {
      setSelected({});
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createEmail?.trim()) return;
    setCreating(true);
    setCreateMessage('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword.trim() || undefined,
          firstName: createFirstName.trim() || undefined,
          lastName: createLastName.trim() || undefined,
          role: createRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCreateMessage(`User created: ${data.user.email} (${formatRoleLabel(data.user.role)})`);
        setCreateEmail('');
        setCreatePassword('');
        setCreateFirstName('');
        setCreateLastName('');
        setCreateRole('student');
        await loadUsers(true);
        setShowCreateForm(false);
      } else {
        setCreateMessage('');
        showToast({ type: 'error', message: data.error || 'Create failed' });
      }
    } catch {
      setCreateMessage('');
      showToast({ type: 'error', message: 'Something went wrong' });
    } finally {
      setCreating(false);
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    setMessage('');
    const res = await fetch('/api/admin/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        userIds: selectedIds,
        action: bulkAction,
        role: bulkAction === 'set_role' ? bulkRole : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage(`Updated ${data.updated} users.`);
      setSelected({});
      await loadUsers();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Bulk update failed.');
    }
  };

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  function getInitials(user) {
    const first = user.first_name?.[0] || user.email?.[0] || '?';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
      <AdminPageHeader
        title="Users"
        description="Search, filter, and manage user accounts. Create students and facilitators here; assign them to cohorts from the cohort detail page."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      {/* Create User Section */}
      {!showCreateForm ? (
        <div style={cardContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
              Create a new student or facilitator, then assign them to a cohort from Admin &rarr; Cohorts &rarr; [cohort].
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#0052a3',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create user
            </button>
          </div>
        </div>
      ) : (
        <div style={cardContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Create user</h2>
            <button
              onClick={() => { setShowCreateForm(false); setCreateMessage(''); }}
              style={{
                padding: '0.4rem 1rem',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              aria-label="Close form"
            >
              Cancel
            </button>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
            After creating, assign them to a cohort from Admin &rarr; Cohorts &rarr; [cohort] &rarr; Enroll student / Add facilitator.
          </p>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem 1rem', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@example.com"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Password (optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Leave blank for no login"
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((s) => !s)}
                  disabled={creating}
                  aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    color: '#6b7280',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  {showCreatePassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                value={createFirstName}
                onChange={(e) => setCreateFirstName(e.target.value)}
                placeholder="First name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                value={createLastName}
                onChange={(e) => setCreateLastName(e.target.value)}
                placeholder="Last name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                style={inputStyle}
                aria-label="Role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{formatRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: creating ? '#93c5fd' : '#0052a3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  width: '100%',
                }}
              >
                {creating ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>
          {createMessage && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#059669', fontWeight: 500 }}>{createMessage}</p>
          )}
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <div style={cardContainerStyle}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={labelStyle}>Filters</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers(true)}
              style={inputStyle}
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); loadUsers(true); }}
              style={inputStyle}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{formatRoleLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); loadUsers(true); }}
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
          <span style={labelStyle}>Bulk Actions</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
            >
              <option value="">Bulk action</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="set_role">Set role</option>
            </select>
            {bulkAction === 'set_role' && (
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: 120 }}
                aria-label="Select role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{formatRoleLabel(r)}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleBulk}
              disabled={selectedIds.length === 0 || !bulkAction}
              style={{
                padding: '0.5rem 1rem',
                background: (selectedIds.length === 0 || !bulkAction) ? '#d1d5db' : '#0052a3',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: (selectedIds.length === 0 || !bulkAction) ? 'not-allowed' : 'pointer',
              }}
            >
              Apply
            </button>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{selectedIds.length} selected</span>
          </div>
        </div>
      </div>

      {/* User List */}
      <div style={cardContainerStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p style={{ fontSize: '0.9375rem' }}>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No users found.</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#0052a3' }}
                />
                Select all on page
              </label>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Showing {pageStart}-{pageEnd} of {total}
              </span>
            </div>

            {/* User Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.map((u) => {
                const statusKey = u.is_active ? 'active' : 'inactive';
                const config = STATUS_CONFIG[statusKey];
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      background: selected[u.id] ? 'rgba(0, 82, 163, 0.03)' : '#fff',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={!!selected[u.id]}
                      onChange={() => toggleSelect(u.id)}
                      aria-label={`Select ${u.first_name || ''} ${u.last_name || ''}`}
                      style={{ width: 16, height: 16, accentColor: '#0052a3', flexShrink: 0 }}
                    />

                    {/* Avatar */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      flexShrink: 0,
                    }}>
                      {getInitials(u)}
                    </div>

                    {/* Name and Email */}
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Link
                        href={`/admin/users/${u.id}`}
                        style={{
                          fontWeight: 600,
                          color: '#0052a3',
                          fontSize: '0.9375rem',
                          textDecoration: 'none',
                        }}
                      >
                        {u.first_name || ''} {u.last_name || ''}
                      </Link>
                      <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{u.email}</div>
                    </div>

                    {/* Role Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: 'rgba(0, 82, 163, 0.1)',
                      color: '#0052a3',
                      flexShrink: 0,
                    }}>
                      {formatRoleLabel(u.role)}
                    </span>

                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: config.bg,
                      color: config.color,
                      flexShrink: 0,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color }} />
                      {config.label}
                    </span>

                    {/* Created Date */}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #f3f4f6',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    const next = Math.max(0, offset - limit);
                    loadUsers(false, next);
                  }}
                  disabled={offset === 0}
                  style={{
                    padding: '0.4rem 1rem',
                    background: offset === 0 ? '#f9fafb' : '#fff',
                    color: offset === 0 ? '#d1d5db' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    const next = offset + limit;
                    if (next < total) loadUsers(false, next);
                  }}
                  disabled={offset + limit >= total}
                  style={{
                    padding: '0.4rem 1rem',
                    background: offset + limit >= total ? '#f9fafb' : '#fff',
                    color: offset + limit >= total ? '#d1d5db' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
