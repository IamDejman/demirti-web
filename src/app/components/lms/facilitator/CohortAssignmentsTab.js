'use client';

import { useState } from 'react';
import { LmsCard, LmsEmptyState, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

const EMPTY_FORM = {
  weekId: '',
  title: '',
  description: '',
  deadlineAt: '',
  submissionType: 'text',
  maxScore: 100,
  isPublished: true,
};

export default function CohortAssignmentsTab({ cohortId, weeks, assignments, onReload }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const hasWeeks = weeks.length > 0;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '';

  const isSuccess = (msg) => {
    if (!msg) return false;
    const l = msg.toLowerCase();
    return l.includes('success') || l.includes('created') || l.includes('deleted') || l.includes('updated');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.weekId) { setMessage('Please select a week.'); return; }
    if (!form.title.trim()) { setMessage('Title is required.'); return; }
    if (!form.deadlineAt) { setMessage('Deadline is required.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          weekId: form.weekId,
          cohortId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          deadlineAt: new Date(form.deadlineAt).toISOString(),
          submissionType: form.submissionType,
          maxScore: Number(form.maxScore) || 100,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || 'Failed to create assignment.'); return; }
      setMessage('Assignment created successfully!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      await onReload();
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* toggle published/draft */
  const handleTogglePublish = async (assignment) => {
    const nextPublished = !assignment.is_published;
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ isPublished: nextPublished }),
      });
      if (res.ok) {
        setMessage(`Assignment ${nextPublished ? 'published' : 'unpublished'} successfully!`);
        await onReload();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch { /* silent */ }
  };

  /* delete */
  const handleDelete = async (assignment) => {
    if (!confirm(`Delete "${assignment.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
        headers: getLmsAuthHeaders(),
      });
      if (res.ok) {
        setMessage('Assignment deleted successfully!');
        await onReload();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to delete assignment.');
      }
    } catch {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      <LmsCard
        title="Assignments"
        subtitle={`${assignments.length} total`}
        icon={LmsIcons.clipboard}
        hoverable={false}
        action={
          <button
            type="button"
            onClick={() => hasWeeks && setShowForm((v) => !v)}
            disabled={!hasWeeks}
            title={!hasWeeks ? 'Add weeks first before creating assignments' : undefined}
            className={`lms-btn lms-btn-sm ${showForm ? 'lms-btn-secondary' : 'lms-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '+ New'}
          </button>
        }
      >
        {!hasWeeks && (
          <p className="lms-warning-banner">
            Weeks must be configured by an admin before you can create assignments.
          </p>
        )}

        {showForm && (
          <div className="lms-form-section">
            <h4 className="lms-form-section-title">Create assignment</h4>

            {message && (
              <p className={`lms-form-message ${isSuccess(message) ? 'lms-form-message-success' : 'lms-form-message-error'}`}>
                {message}
              </p>
            )}

            <form onSubmit={handleCreate} className="lms-form-stack">
              <div className="lms-field">
                <label className="lms-field-label">Week *</label>
                <select value={form.weekId} onChange={(e) => setForm((f) => ({ ...f, weekId: e.target.value }))} className="lms-input">
                  <option value="">Select week</option>
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>Week {w.week_number} &middot; {w.title}</option>
                  ))}
                </select>
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Title *</label>
                <input type="text" placeholder="e.g. Week 1 Project" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="lms-input" />
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Description (optional)</label>
                <textarea placeholder="Assignment instructions..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="lms-input" />
              </div>

              <div className="lms-form-grid">
                <div className="lms-field">
                  <label className="lms-field-label">Deadline *</label>
                  <input type="datetime-local" value={form.deadlineAt} onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))} className="lms-input" />
                </div>
                <div className="lms-field">
                  <label className="lms-field-label">Submission type</label>
                  <select value={form.submissionType} onChange={(e) => setForm((f) => ({ ...f, submissionType: e.target.value }))} className="lms-input">
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="file_upload">File upload</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Max score</label>
                <input type="number" min={0} value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))} className="lms-input lms-input-narrow" />
              </div>

              <label className="lms-checkbox-label">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Publish immediately
              </label>

              <div>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && message && (
          <p className={`lms-form-message ${isSuccess(message) ? 'lms-form-message-success' : 'lms-form-message-error'}`}>
            {message}
          </p>
        )}

        {assignments.length === 0 ? (
          <LmsEmptyState
            icon={LmsIcons.clipboard}
            title="No assignments yet"
            description={hasWeeks ? 'Click "+ New" to create one.' : 'Weeks must be configured first.'}
          />
        ) : (
          <div className="lms-table-wrapper">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Week</th>
                  <th>Deadline</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const deadlinePast = a.deadline_at && new Date(a.deadline_at) < new Date();
                  return (
                    <tr key={a.id}>
                      <td className="lms-row-item-name">{a.title}</td>
                      <td className="lms-row-item-detail">Week {a.week_number ?? a.week_title ?? '\u2014'}</td>
                      <td style={{ color: deadlinePast ? '#dc2626' : undefined }}>{a.deadline_at ? formatDate(a.deadline_at) : '\u2014'}</td>
                      <td className="lms-row-item-detail"><span style={{ textTransform: 'capitalize' }}>{(a.submission_type || 'text').replace('_', ' ')}</span></td>
                      <td className="lms-row-item-detail">{a.max_score ?? 100}</td>
                      <td>
                        {a.is_published ? (
                          <LmsBadge variant="success">Published</LmsBadge>
                        ) : (
                          <LmsBadge variant="neutral">Draft</LmsBadge>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(a)}
                            className="lms-btn lms-btn-sm lms-btn-outline"
                            title={a.is_published ? 'Unpublish this assignment' : 'Publish this assignment'}
                          >
                            {a.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            className="lms-btn lms-btn-sm lms-btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LmsCard>
    </div>
  );
}
