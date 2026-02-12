'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorGradingPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const loadQueue = async () => {
    const res = await fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.submissions) setSubmissions(data.submissions);
  };

  useEffect(() => {
    loadQueue().finally(() => setLoading(false));
  }, []);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading || score === '') return;
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${grading.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ score: parseInt(score, 10), feedback: feedback.trim() || null }),
      });
      if (res.ok) {
        setGrading(null);
        setScore('');
        setFeedback('');
        await loadQueue();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Grading queue" subtitle="Review and grade student submissions." icon={LmsIcons.grading} />

      {grading ? (
        <LmsCard title="Grade submission" subtitle={`${grading.assignment_title} · ${grading.first_name} ${grading.last_name}`}>
          <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>Submitted {formatDate(grading.submitted_at)}</p>
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--neutral-50)' }}>
            {grading.link_url && <p><a href={grading.link_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open submission link</a></p>}
            {grading.text_content && <p className="mt-2" style={{ color: 'var(--neutral-700)' }}>{grading.text_content}</p>}
            {grading.file_url && <p><a href={grading.file_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open file</a></p>}
          </div>
          <form onSubmit={handleGrade} className="mt-6 space-y-4">
            <div>
              <label className="lms-form-label block">Score (0–{grading.max_score ?? 100})</label>
              <input
                type="number"
                min={0}
                max={grading.max_score ?? 100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                className="lms-form-input mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="lms-form-label block">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="lms-form-textarea mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional feedback..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                {saving ? 'Saving...' : 'Submit grade'}
              </button>
              <button type="button" onClick={() => { setGrading(null); setScore(''); setFeedback(''); }} className="lms-btn lms-btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </LmsCard>
      ) : null}

      <LmsCard title="Pending submissions" hoverable={false}>
        {submissions.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.checkCircle} title="No pending submissions to grade" description="New submissions will appear here when students submit." />
        ) : (
          <div className="lms-table-wrapper">
            <table className="lms-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Student</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium" style={{ color: 'var(--neutral-900)' }}>{s.assignment_title}</td>
                  <td style={{ color: 'var(--neutral-600)' }}>{s.first_name} {s.last_name}</td>
                  <td style={{ color: 'var(--neutral-600)' }}>{formatDate(s.submitted_at)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => { setGrading(s); setScore(''); setFeedback(''); }}
                      className="lms-btn lms-btn-sm lms-btn-primary"
                    >
                      Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </LmsCard>
    </div>
  );
}
