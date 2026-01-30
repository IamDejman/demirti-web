'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'pageview', matchValue: '', matchType: 'contains' });
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadGoals();
  }, [router]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/goals', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setGoals(data.goals || []);
      else if (res.status === 401) router.push('/admin/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.matchValue) return;
    try {
      const url = editing ? `/api/admin/goals/${editing.id}` : '/api/admin/goals';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { name: form.name, type: form.type, matchValue: form.matchValue, matchType: form.matchType }
        : { name: form.name, type: form.type, matchValue: form.matchValue, matchType: form.matchType };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowForm(false);
        setEditing(null);
        setForm({ name: '', type: 'pageview', matchValue: '', matchType: 'contains' });
        loadGoals();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      const res = await fetch(`/api/admin/goals/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) loadGoals();
      else alert(data.error || 'Failed to delete');
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (goal) => {
    setEditing(goal);
    setForm({
      name: goal.name,
      type: goal.type || 'pageview',
      matchValue: goal.match_value || '',
      matchType: goal.match_type || 'contains',
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', type: 'pageview', matchValue: '', matchType: 'contains' });
    setShowForm(true);
  };

  return (
    <main className="admin-with-fixed-nav">
      <AdminNavbar />
      <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="admin-page-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 className="admin-page-title">Goals</h1>
            <button
              type="button"
              onClick={openNew}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Add goal
            </button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-light)' }}>Loading goals...</p>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e4e8', background: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Match</th>
                    <th style={{ padding: '0.75rem', width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{g.name}</td>
                      <td style={{ padding: '0.75rem' }}>{g.type}</td>
                      <td style={{ padding: '0.75rem' }}>{g.match_type}: {g.match_value}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button type="button" onClick={() => openEdit(g)} style={{ marginRight: 8, padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
                        <button type="button" onClick={() => handleDelete(g.id)} style={{ padding: '4px 8px', color: '#dc3545', cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {goals.length === 0 && !loading && <p style={{ padding: '1.5rem', color: 'var(--text-light)' }}>No goals yet. Add one to track conversions.</p>}
            </div>
          )}

          {showForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, maxWidth: 400, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginBottom: '1rem' }}>{editing ? 'Edit goal' : 'New goal'}</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: 8 }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: 8 }}>
                      <option value="pageview">Pageview</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Match value (URL pattern or event name)</label>
                    <input
                      type="text"
                      value={form.matchValue}
                      onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
                      required
                      placeholder={form.type === 'pageview' ? '/pricing' : 'contact_form_submitted'}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: 8 }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Match type</label>
                    <select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: 8 }}>
                      <option value="exact">Exact</option>
                      <option value="contains">Contains</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #e1e4e8', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
