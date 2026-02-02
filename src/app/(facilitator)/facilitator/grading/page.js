'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function FacilitatorGradingPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const loadQueue = async () => {
    const res = await fetch('/api/facilitator/grading-queue', { headers: getAuthHeaders() });
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ score: parseInt(score, 10), feedback: feedback.trim() || null }),
      });
      if (res.ok) {
        setGrading(null);
        setScore('');
        setFeedback('');
        await loadQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading grading queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Grading queue</h1>

      {grading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{grading.assignment_title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {grading.first_name} {grading.last_name} · {grading.email} · Submitted {formatDate(grading.submitted_at)}
          </p>
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
                className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional feedback..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
                {saving ? 'Saving...' : 'Submit grade'}
              </button>
              <button type="button" onClick={() => { setGrading(null); setScore(''); setFeedback(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No pending submissions to grade.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.assignment_title}</td>
                  <td className="py-3 px-4 text-gray-600">{s.first_name} {s.last_name}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(s.submitted_at)}</td>
                  <td className="py-3 px-4">
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
    </div>
  );
}
