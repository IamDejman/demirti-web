'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader, AdminButton } from '../../components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminFunnelsPage() {
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', steps: [{ type: 'pageview', matchValue: '', label: '' }] });
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadFunnels();
  }, [router]);

  const loadFunnels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/funnels', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setFunnels(data.funnels || []);
      else if (res.status === 401) router.push('/admin/login');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.steps.length) return;
    const steps = form.steps.map((s) => ({ type: s.type || 'pageview', match_value: s.matchValue, label: s.label || s.matchValue }));
    try {
      const url = editing ? `/api/admin/funnels/${editing.id}` : '/api/admin/funnels';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: form.name, steps }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowForm(false);
        setEditing(null);
        setForm({ name: '', steps: [{ type: 'pageview', matchValue: '', label: '' }] });
        loadFunnels();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save funnel');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this funnel?')) return;
    try {
      const res = await fetch(`/api/admin/funnels/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) loadFunnels();
      else alert(data.error || 'Failed to delete');
    } catch {
    }
  };

  const openEdit = (funnel) => {
    setEditing(funnel);
    const steps = (funnel.steps || []).map((s) => ({
      type: s.type || 'pageview',
      matchValue: s.match_value || '',
      label: s.label || s.match_value || '',
    }));
    setForm({ name: funnel.name, steps: steps.length ? steps : [{ type: 'pageview', matchValue: '', label: '' }] });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', steps: [{ type: 'pageview', matchValue: '', label: '' }] });
    setShowForm(true);
  };

  const addStep = () => setForm({ ...form, steps: [...form.steps, { type: 'pageview', matchValue: '', label: '' }] });
  const removeStep = (i) => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) });
  const updateStep = (i, field, value) => {
    const steps = [...form.steps];
    steps[i] = { ...steps[i], [field]: value };
    setForm({ ...form, steps });
  };

  return (
    <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
          <AdminPageHeader
            title="Funnels"
            description="Define conversion funnels to track user journeys."
            actions={<AdminButton variant="primary" onClick={openNew}>Add funnel</AdminButton>}
          />

          {loading ? (
            <p style={{ color: 'var(--text-light)' }}>Loading funnels...</p>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e4e8', background: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Steps</th>
                    <th style={{ padding: '0.75rem', width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {funnels.map((f) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{f.name}</td>
                      <td style={{ padding: '0.75rem' }}>{(f.steps || []).length} steps</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button type="button" onClick={() => openEdit(f)} style={{ marginRight: 8, padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
                        <button type="button" onClick={() => handleDelete(f.id)} style={{ padding: '4px 8px', color: '#dc3545', cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {funnels.length === 0 && !loading && <p style={{ padding: '1.5rem', color: 'var(--text-light)' }}>No funnels yet. Add one to track conversion steps.</p>}
            </div>
          )}

          {showForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={() => setShowForm(false)}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginBottom: '1rem' }}>{editing ? 'Edit funnel' : 'New funnel'}</h2>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 600 }}>Steps</label>
                      <button type="button" onClick={addStep} style={{ padding: '4px 8px', fontSize: 14, cursor: 'pointer' }}>+ Step</button>
                    </div>
                    {form.steps.map((step, i) => (
                      <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: '0.75rem', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                          <select value={step.type} onChange={(e) => updateStep(i, 'type', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6 }}>
                            <option value="pageview">Pageview</option>
                            <option value="event">Event</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Match value (URL part or event name)"
                            value={step.matchValue}
                            onChange={(e) => updateStep(i, 'matchValue', e.target.value)}
                            style={{ flex: 1, padding: '4px 8px', border: '1px solid #e1e4e8', borderRadius: 6 }}
                          />
                          <button type="button" onClick={() => removeStep(i)} style={{ padding: '4px 8px', color: '#dc3545' }}>Remove</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Label (optional)"
                          value={step.label}
                          onChange={(e) => updateStep(i, 'label', e.target.value)}
                          style={{ width: '100%', padding: '4px 8px', border: '1px solid #e1e4e8', borderRadius: 6 }}
                        />
                      </div>
                    ))}
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
  );
}
