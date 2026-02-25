'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
  AdminTable,
  AdminEmptyState,
} from '../../components/admin';
import { useToast } from '../../components/ToastProvider';

import { getAuthHeaders } from '@/lib/authClient';

const ROLE_OPTIONS = ['student', 'facilitator', 'alumni', 'admin', 'guest'];

function formatRoleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

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
    // Avoid duplicate initial load (e.g. from React Strict Mode double-mount in dev)
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

  const columns = [
    {
      key: 'select',
      label: 'Select',
      render: (u) => (
        <input
          type="checkbox"
          checked={!!selected[u.id]}
          onChange={() => toggleSelect(u.id)}
          aria-label={`Select ${u.first_name} ${u.last_name}`}
        />
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (u) => (
        <div>
          <Link href={`/admin/users/${u.id}`} className="admin-link-primary" style={{ textDecoration: 'underline' }}>
            {u.first_name || ''} {u.last_name || ''}
          </Link>
          <div className="admin-list-item-meta" style={{ marginTop: '0.25rem' }}>{u.email}</div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (u) => formatRoleLabel(u.role) },
    { key: 'status', label: 'Status', render: (u) => (u.is_active ? 'Active' : 'Inactive') },
    { key: 'created', label: 'Created', render: (u) => new Date(u.created_at).toLocaleDateString() },
  ];

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Users"
        description="Search, filter, and manage user accounts. Create students and facilitators here; assign them to cohorts from the cohort detail page."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      {!showCreateForm ? (
        <AdminCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p className="admin-form-hint" style={{ margin: 0 }}>Create a new student or facilitator, then assign them to a cohort from Admin → Cohorts → [cohort].</p>
            <AdminButton variant="primary" onClick={() => setShowCreateForm(true)}>
              Create user
            </AdminButton>
          </div>
        </AdminCard>
      ) : (
        <AdminCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>Create user</h2>
            <AdminButton variant="secondary" onClick={() => { setShowCreateForm(false); setCreateMessage(''); }} aria-label="Close form">
              Cancel
            </AdminButton>
          </div>
          <p className="admin-form-hint" style={{ marginBottom: '1rem' }}>After creating, assign them to a cohort from Admin → Cohorts → [cohort] → Enroll student / Add facilitator.</p>
          <form onSubmit={handleCreateUser} className="admin-filters-grid" style={{ alignItems: 'end', gap: '0.75rem 1rem' }}>
            <AdminFormField>
              <label className="admin-form-label">Email *</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@example.com"
                className={inputClass}
                required
              />
            </AdminFormField>
            <AdminFormField>
              <label className="admin-form-label">Password (optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Leave blank for no login"
                  className={inputClass}
                  style={{ paddingRight: '3rem' }}
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
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  {showCreatePassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </AdminFormField>
            <AdminFormField>
              <label className="admin-form-label">First name</label>
              <input
                type="text"
                value={createFirstName}
                onChange={(e) => setCreateFirstName(e.target.value)}
                placeholder="First name"
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField>
              <label className="admin-form-label">Last name</label>
              <input
                type="text"
                value={createLastName}
                onChange={(e) => setCreateLastName(e.target.value)}
                placeholder="Last name"
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField>
              <label className="admin-form-label">Role</label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                className={inputClass}
                aria-label="Role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{formatRoleLabel(r)}</option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField style={{ marginBottom: 0 }}>
              <AdminButton type="submit" variant="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create user'}
              </AdminButton>
            </AdminFormField>
          </form>
          {createMessage && <p className="admin-form-hint" style={{ marginTop: '0.75rem', color: '#059669' }}>{createMessage}</p>}
        </AdminCard>
      )}

      <AdminCard>
        <div className="admin-filters-grid">
          <AdminFormField>
            <input
              type="text"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers(true)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); loadUsers(true); }}
              className={inputClass}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{formatRoleLabel(r)}</option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); loadUsers(true); }}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </AdminFormField>
        </div>
        <div className="admin-action-group" style={{ marginTop: '1rem' }}>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className={inputClass}
            style={{ width: 'auto', minWidth: '140px' }}
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
              className={inputClass}
              style={{ width: 'auto', minWidth: '120px' }}
              aria-label="Select role"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{formatRoleLabel(r)}</option>
              ))}
            </select>
          )}
          <AdminButton
            variant="primary"
            onClick={handleBulk}
            disabled={selectedIds.length === 0 || !bulkAction}
          >
            Apply
          </AdminButton>
          <span className="admin-meta">{selectedIds.length} selected</span>
        </div>
      </AdminCard>

      <AdminCard>
        {loading ? (
          <p className="admin-loading">Loading users...</p>
        ) : users.length === 0 ? (
          <AdminEmptyState message="No users found." description="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="admin-table-header">
              <label className="admin-form-checkbox" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span>Select all on page</span>
              </label>
              <span className="admin-meta">Showing {pageStart}-{pageEnd} of {total}</span>
            </div>
            <AdminTable columns={columns} data={users} rowKey="id" />
            <div className="admin-pagination">
              <AdminButton
                variant="secondary"
                onClick={() => {
                  const next = Math.max(0, offset - limit);
                  loadUsers(false, next);
                }}
                disabled={offset === 0}
              >
                Previous
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => {
                  const next = offset + limit;
                  if (next < total) loadUsers(false, next);
                }}
                disabled={offset + limit >= total}
              >
                Next
              </AdminButton>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
