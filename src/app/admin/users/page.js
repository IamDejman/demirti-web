'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ROLE_OPTIONS = ['student', 'facilitator', 'alumni', 'admin', 'guest'];

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

  const loadUsers = async (resetOffset = false) => {
    const nextOffset = resetOffset ? 0 : offset;
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
      users.forEach((u) => {
        next[u.id] = true;
      });
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
      setMessage(`Updated ${data.updated} users.`);
      setSelected({});
      await loadUsers();
    } else {
      setMessage(data.error || 'Bulk update failed.');
    }
  };

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + limit, total);

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              onClick={() => loadUsers(true)}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Search
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleBulk}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm"
              disabled={selectedIds.length === 0 || !bulkAction}
            >
              Apply
            </button>
            <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <p className="text-gray-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500">No users found.</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  Select all on page
                </label>
                <span>Showing {pageStart}-{pageEnd} of {total}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-2">Select</th>
                      <th className="py-2">User</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100">
                        <td className="py-2">
                          <input type="checkbox" checked={!!selected[u.id]} onChange={() => toggleSelect(u.id)} />
                        </td>
                        <td className="py-2">
                          <div className="font-medium text-gray-900">
                            <Link href={`/admin/users/${u.id}`} className="hover:underline">
                              {u.first_name || ''} {u.last_name || ''}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="py-2">{u.role}</td>
                        <td className="py-2">{u.is_active ? 'Active' : 'Inactive'}</td>
                        <td className="py-2">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(0, offset - limit);
                    setOffset(next);
                    loadUsers();
                  }}
                  disabled={offset === 0}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = offset + limit;
                    if (next >= total) return;
                    setOffset(next);
                    loadUsers();
                  }}
                  disabled={offset + limit >= total}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
  );
}
