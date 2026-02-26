'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

const EMPTY_ASSIGNMENT_FORM = {
  weekId: '',
  title: '',
  description: '',
  deadlineAt: '',
  submissionType: 'text',
  maxScore: 100,
  isPublished: true,
};

export default function FacilitatorCohortPage() {
  const params = useParams();
  const id = params?.id;
  const [cohort, setCohort] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment creation state
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [cohortRes, weeksRes, studentsRes, liveRes, assignRes] = await Promise.all([
        fetch(`/api/cohorts/${id}`, { headers: getLmsAuthHeaders() }),
        fetch(`/api/cohorts/${id}/weeks`, { headers: getLmsAuthHeaders() }),
        fetch(`/api/cohorts/${id}/students`, { headers: getLmsAuthHeaders() }),
        fetch(`/api/cohorts/${id}/live-classes`, { headers: getLmsAuthHeaders() }),
        fetch(`/api/cohorts/${id}/assignments`, { headers: getLmsAuthHeaders() }),
      ]);
      const cohortData = await cohortRes.json();
      const weeksData = await weeksRes.json();
      const studentsData = await studentsRes.json();
      const liveData = await liveRes.json();
      const assignData = await assignRes.json();
      if (cohortRes.ok && cohortData.cohort) setCohort(cohortData.cohort);
      if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
      if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
      if (liveRes.ok && liveData.liveClasses) setLiveClasses(liveData.liveClasses);
      if (assignRes.ok && assignData.assignments) setAssignments(assignData.assignments);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reloadAssignments = async () => {
    try {
      const res = await fetch(`/api/cohorts/${id}/assignments`, { headers: getLmsAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.assignments) setAssignments(data.assignments);
    } catch { /* keep existing */ }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignmentMessage('');

    if (!assignmentForm.weekId) {
      setAssignmentMessage('Please select a week.');
      return;
    }
    if (!assignmentForm.title.trim()) {
      setAssignmentMessage('Title is required.');
      return;
    }
    if (!assignmentForm.deadlineAt) {
      setAssignmentMessage('Deadline is required.');
      return;
    }

    setSavingAssignment(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          weekId: assignmentForm.weekId,
          cohortId: id,
          title: assignmentForm.title.trim(),
          description: assignmentForm.description.trim() || null,
          deadlineAt: new Date(assignmentForm.deadlineAt).toISOString(),
          submissionType: assignmentForm.submissionType,
          maxScore: Number(assignmentForm.maxScore) || 100,
          isPublished: assignmentForm.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignmentMessage(data.error || 'Failed to create assignment.');
        return;
      }
      setAssignmentMessage('Assignment created successfully!');
      setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
      await reloadAssignments();
      setTimeout(() => setAssignmentMessage(''), 4000);
    } catch {
      setAssignmentMessage('Network error. Please try again.');
    } finally {
      setSavingAssignment(false);
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

  if (!cohort) {
    return (
      <LmsCard>
        <LmsEmptyState
          icon={LmsIcons.inbox}
          title="Cohort not found"
          description="You may not have access to this cohort or it no longer exists."
          action={<Link href="/facilitator" className="text-primary font-medium hover:underline">Back to dashboard</Link>}
        />
      </LmsCard>
    );
  }

  const isSuccess = assignmentMessage.toLowerCase().includes('success') || assignmentMessage.toLowerCase().includes('created');

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title={cohort.name}
        subtitle={cohort.track_name}
        icon={LmsIcons.graduation}
        breadcrumb={{ href: '/facilitator', label: 'Dashboard' }}
      >
        {cohort.start_date && (
          <p className="text-sm mt-2 opacity-80">
            {formatDate(cohort.start_date)} – {formatDate(cohort.end_date)}
          </p>
        )}
      </LmsPageHeader>

      <div className="grid md:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
        <LmsCard title="Quick actions" hoverable={false}>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/facilitator/grading"
              className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
            >
              Grading queue
            </Link>
            <Link
              href="/facilitator/attendance"
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg hover:bg-gray-50"
              style={{ borderColor: 'var(--neutral-200)', color: 'var(--neutral-700)' }}
            >
              Attendance
            </Link>
          </div>
        </LmsCard>
      </div>

      <LmsCard
        title="Weeks"
        icon={LmsIcons.calendar}
        subtitle={`${weeks.length} weeks in curriculum`}
      >
        {weeks.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.calendar} title="No weeks configured" description="Weeks are managed in the admin cohort view." />
        ) : (
          <ul className="space-y-2">
            {weeks.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>Week {w.week_number}: {w.title}</span>
                {w.is_locked && <LmsBadge variant="warning">Locked</LmsBadge>}
              </li>
            ))}
          </ul>
        )}
      </LmsCard>

      <LmsCard
        title="Live classes"
        subtitle={`${liveClasses.length} scheduled`}
        icon={LmsIcons.video}
      >
        {liveClasses.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.video} title="No live classes" description="Live classes are scheduled per week in the admin cohort view." />
        ) : (
          <ul className="space-y-2">
            {liveClasses.slice(0, 5).map((lc) => (
              <li key={lc.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>{lc.week_title || 'Week'}</span>
                <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(lc.scheduled_at)}</span>
              </li>
            ))}
            {liveClasses.length > 5 && <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>+{liveClasses.length - 5} more</p>}
          </ul>
        )}
      </LmsCard>

      <LmsCard
        title="Students"
        subtitle={`${students.length} enrolled`}
        icon={LmsIcons.users}
      >
        {students.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.users} title="No students enrolled" description="Students enroll through the admin or application flow." />
        ) : (
          <div className="lms-table-wrapper">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 20).map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium" style={{ color: 'var(--neutral-900)' }}>{s.first_name} {s.last_name}</td>
                    <td style={{ color: 'var(--neutral-600)' }}>{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 20 && <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>+{students.length - 20} more</p>}
          </div>
        )}
      </LmsCard>

      {/* Assignments — create + list */}
      <LmsCard
        title="Assignments"
        subtitle={`${assignments.length} total`}
        icon={LmsIcons.clipboard}
        action={
          weeks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAssignmentForm((v) => !v)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg"
              style={{
                background: showAssignmentForm ? 'var(--neutral-100)' : 'var(--primary)',
                color: showAssignmentForm ? 'var(--neutral-700)' : '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showAssignmentForm ? 'Cancel' : '+ New Assignment'}
            </button>
          )
        }
      >
        {/* Create assignment form */}
        {showAssignmentForm && (
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--neutral-50, #f9fafb)', border: '1px solid var(--neutral-200, #e5e7eb)' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--neutral-900)' }}>Create assignment</h4>

            {assignmentMessage && (
              <p className="text-sm mb-3" style={{ color: isSuccess ? '#059669' : '#dc2626' }}>{assignmentMessage}</p>
            )}

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Week *</label>
                <select
                  value={assignmentForm.weekId}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, weekId: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem' }}
                >
                  <option value="">Select week</option>
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>Week {w.week_number} &middot; {w.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Week 1 Project"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Description (optional)</label>
                <textarea
                  placeholder="Assignment instructions..."
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '0.75rem' }}>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Deadline *</label>
                  <input
                    type="datetime-local"
                    value={assignmentForm.deadlineAt}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, deadlineAt: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Submission type</label>
                  <select
                    value={assignmentForm.submissionType}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, submissionType: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem' }}
                  >
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="file_upload">File upload</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-600)' }}>Max score</label>
                <input
                  type="number"
                  min={0}
                  value={assignmentForm.maxScore}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, maxScore: e.target.value }))}
                  style={{ width: '120px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-300, #d1d5db)', fontSize: '0.875rem' }}
                />
              </div>

              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--neutral-700)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={assignmentForm.isPublished}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Publish immediately (notify students)
              </label>

              <button
                type="submit"
                disabled={savingAssignment}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: savingAssignment ? 'not-allowed' : 'pointer',
                  opacity: savingAssignment ? 0.6 : 1,
                  alignSelf: 'flex-start',
                }}
              >
                {savingAssignment ? 'Creating...' : 'Create Assignment'}
              </button>
            </form>
          </div>
        )}

        {/* Assignment list */}
        {assignments.length === 0 ? (
          <LmsEmptyState
            icon={LmsIcons.clipboard}
            title="No assignments yet"
            description={weeks.length > 0 ? 'Click "+ New Assignment" to create one.' : 'Weeks must be configured first before assignments can be created.'}
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
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const deadlinePast = a.deadline_at && new Date(a.deadline_at) < new Date();
                  return (
                    <tr key={a.id}>
                      <td className="font-medium" style={{ color: 'var(--neutral-900)' }}>{a.title}</td>
                      <td style={{ color: 'var(--neutral-600)' }}>Week {a.week_number ?? a.week_title ?? '—'}</td>
                      <td style={{ color: deadlinePast ? '#dc2626' : 'var(--neutral-600)' }}>
                        {a.deadline_at ? formatDate(a.deadline_at) : '—'}
                      </td>
                      <td style={{ color: 'var(--neutral-500)' }}>
                        <span className="capitalize">{(a.submission_type || 'text').replace('_', ' ')}</span>
                      </td>
                      <td style={{ color: 'var(--neutral-500)' }}>{a.max_score ?? 100}</td>
                      <td>
                        {a.is_published ? (
                          <LmsBadge variant="success" dot>Published</LmsBadge>
                        ) : (
                          <LmsBadge variant="neutral">Draft</LmsBadge>
                        )}
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
