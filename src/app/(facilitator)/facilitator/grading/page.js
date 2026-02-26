'use client';

import { useState, useEffect, useMemo } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorGradingPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  const loadQueue = async () => {
    const res = await fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.submissions) setSubmissions(data.submissions);
  };

  useEffect(() => {
    loadQueue().finally(() => setLoading(false));
  }, []);

  const maxScore = grading?.max_score ?? 100;

  const handleScoreChange = (e) => {
    const val = e.target.value;
    if (val === '' || val === '-') { setScore(val); return; }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    setScore(String(Math.min(Math.max(0, num), maxScore)));
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading || score === '') return;
    const num = parseInt(score, 10);
    if (isNaN(num) || num < 0 || num > maxScore) return;
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

  /* Group submissions by assignment */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of submissions) {
      const key = s.assignment_id || s.assignment_title;
      if (!map.has(key)) {
        map.set(key, {
          assignmentTitle: s.assignment_title,
          weekNumber: s.week_number,
          cohortName: s.cohort_name,
          submissions: [],
        });
      }
      map.get(key).submissions.push(s);
    }
    return [...map.values()];
  }, [submissions]);

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
        <LmsCard title="Grade submission" subtitle={`${grading.assignment_title}${grading.week_number ? ` · Week ${grading.week_number}` : ''} · ${grading.first_name} ${grading.last_name}`}>
          <div className="lms-form-section" style={{ marginBottom: 0 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', margin: '0 0 0.75rem' }}>
              Submitted {formatDate(grading.submitted_at)}{grading.cohort_name ? ` · ${grading.cohort_name}` : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {grading.link_url && (
                <a href={grading.link_url} target="_blank" rel="noopener noreferrer" className="lms-btn lms-btn-sm lms-btn-outline" style={{ alignSelf: 'flex-start' }}>
                  Open submission link ↗
                </a>
              )}
              {grading.text_content && (
                <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', margin: 0, lineHeight: 1.5 }}>{grading.text_content}</p>
              )}
              {grading.file_url && (
                <a href={grading.file_url} target="_blank" rel="noopener noreferrer" className="lms-btn lms-btn-sm lms-btn-outline" style={{ alignSelf: 'flex-start' }}>
                  Open file ↗
                </a>
              )}
            </div>
          </div>

          <form onSubmit={handleGrade} className="lms-form-stack" style={{ marginTop: 'var(--lms-space-5)' }}>
            <div className="lms-form-grid">
              <div className="lms-field">
                <label className="lms-field-label">Score (0–{maxScore})</label>
                <input
                  type="number"
                  min={0}
                  max={maxScore}
                  value={score}
                  onChange={handleScoreChange}
                  required
                  className="lms-input lms-input-narrow"
                />
              </div>
            </div>
            <div className="lms-field">
              <label className="lms-field-label">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="lms-input"
                placeholder="Optional feedback..."
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--lms-space-3)', flexWrap: 'wrap' }}>
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

      {submissions.length === 0 ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState icon={LmsIcons.checkCircle} title="No pending submissions to grade" description="New submissions will appear here when students submit." />
        </LmsCard>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
          {grouped.map((group, gi) => {
            const key = `${group.assignmentTitle}-${gi}`;
            const isExpanded = expandedAssignment === key || expandedAssignment === null;
            return (
              <LmsCard key={key} hoverable={false}>
                <button
                  type="button"
                  onClick={() => setExpandedAssignment(isExpanded && expandedAssignment !== null ? null : key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left', gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--neutral-900)' }}>{group.assignmentTitle}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                      {group.weekNumber ? `Week ${group.weekNumber}` : ''}{group.weekNumber && group.cohortName ? ' · ' : ''}{group.cohortName || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <LmsBadge variant="warning">{group.submissions.length} pending</LmsBadge>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 'var(--lms-space-4)' }}>
                    {group.submissions.map((s) => (
                      <div key={s.id} className="lms-list-item">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                          <span className="lms-list-item-title">{s.first_name} {s.last_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                            Submitted {formatDate(s.submitted_at)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setGrading(s); setScore(''); setFeedback(''); }}
                          className="lms-btn lms-btn-sm lms-btn-primary"
                          style={{ flexShrink: 0 }}
                        >
                          Grade
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </LmsCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
