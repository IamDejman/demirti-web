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

import { getAuthHeaders } from '@/lib/authClient';

const emptyForm = { name: '', trackId: '', cohortId: '' };
const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

export default function AdminCourseTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [applyTarget, setApplyTarget] = useState({});

  const loadData = async () => {
    const [templateRes, trackRes, cohortRes] = await Promise.all([
      fetch('/api/admin/course-templates', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
      fetch('/api/cohorts', { headers: getAuthHeaders() }),
    ]);
    const templateData = await templateRes.json();
    const trackData = await trackRes.json();
    const cohortData = await cohortRes.json();
    if (templateRes.ok && templateData.templates) setTemplates(templateData.templates);
    if (trackRes.ok && trackData.tracks) setTracks(trackData.tracks);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.name.trim()) return;
    const res = await fetch('/api/admin/course-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage('Template created.');
      setForm(emptyForm);
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to create template');
    }
  };

  const handleApply = async (templateId) => {
    const cohortId = applyTarget[templateId];
    if (!cohortId) return;
    await fetch(`/api/admin/course-templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ cohortId }),
    });
    setMessageType('success');
    setMessage('Template applied.');
    await loadData();
  };

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Course Templates"
        description="Create templates and apply them to cohorts to structure course content."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title="Create template">
        <form onSubmit={handleCreate} className="admin-form-section">
          <AdminFormField label="Template name">
            <input
              type="text"
              placeholder="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="Optional track">
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select track</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Copy from cohort (optional)">
              <select
                value={form.cohortId}
                onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </AdminFormField>
          </div>
          <AdminButton type="submit" variant="primary">
            Create template
          </AdminButton>
        </form>
      </AdminCard>

      <AdminCard title="Templates">
        {templates.length === 0 ? (
          <AdminEmptyState message="No templates yet." description="Create a template above." />
        ) : (
          <ul className="admin-list">
            {templates.map((t) => (
              <li key={t.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{t.name}</p>
                  <span className="admin-badge">{t.track_id ? 'Track template' : 'General'}</span>
                </div>
                <div className="admin-action-group" style={{ marginTop: '0.75rem' }}>
                  <select
                    value={applyTarget[t.id] || ''}
                    onChange={(e) => setApplyTarget((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    className={inputClass}
                    style={{ width: 'auto', minWidth: '180px', flex: '1 1 auto' }}
                  >
                    <option value="">Apply to cohort</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <AdminButton variant="primary" onClick={() => handleApply(t.id)}>
                    Apply
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
