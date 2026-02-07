'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsEmptyState } from '@/app/components/lms';

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
      <div className="space-y-6">
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grading queue</h1>
        <p className="text-gray-600 mt-1">Review and grade student submissions.</p>
      </div>

      {grading ? (
        <LmsCard title="Grade submission" subtitle={`${grading.assignment_title} · ${grading.first_name} ${grading.last_name}`}>
          <p className="text-sm text-gray-500">Submitted {formatDate(grading.submitted_at)}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {grading.link_url && <p><a href={grading.link_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open submission link</a></p>}
            {grading.text_content && <p className="text-gray-700 mt-2">{grading.text_content}</p>}
            {grading.file_url && <p><a href={grading.file_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open file</a></p>}
          </div>
          <form onSubmit={handleGrade} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Score (0–{grading.max_score ?? 100})</label>
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
              <label className="block text-sm font-medium text-gray-700">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="lms-form-textarea mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional feedback..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Submit grade'}
              </button>
              <button type="button" onClick={() => { setGrading(null); setScore(''); setFeedback(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </LmsCard>
      ) : null}

      <LmsCard title="Pending submissions" hoverable={false}>
        {submissions.length === 0 ? (
          <LmsEmptyState title="No pending submissions to grade" description="New submissions will appear here when students submit." />
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
                  <td className="font-medium text-gray-900">{s.assignment_title}</td>
                  <td className="text-gray-600">{s.first_name} {s.last_name}</td>
                  <td className="text-gray-600">{formatDate(s.submitted_at)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => { setGrading(s); setScore(''); setFeedback(''); }}
                      className="text-primary font-medium hover:underline"
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
