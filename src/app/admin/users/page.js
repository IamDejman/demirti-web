'use client';

import { useEffect, useState } from 'react';
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

import { getAuthHeaders } from '@/lib/authClient';

const ROLE_OPTIONS = ['student', 'facilitator', 'alumni', 'admin', 'guest'];
const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

export default function AdminUsersPage() {
  const router = useRouter();
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
    { key: 'role', label: 'Role', render: (u) => u.role },
    { key: 'status', label: 'Status', render: (u) => (u.is_active ? 'Active' : 'Inactive') },
    { key: 'created', label: 'Created', render: (u) => new Date(u.created_at).toLocaleDateString() },
  ];

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Users"
        description="Search, filter, and manage user accounts. Use bulk actions to update multiple users."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard>
        <div className="admin-filters-grid">
          <AdminFormField>
            <input
              type="text"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClass}
            />
          </AdminFormField>
          <AdminFormField>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </AdminFormField>
          <AdminButton variant="primary" onClick={() => loadUsers(true)}>
            Search
          </AdminButton>
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
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
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
