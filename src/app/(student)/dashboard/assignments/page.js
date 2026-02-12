'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

function deadlineStatus(dateStr) {
  if (!dateStr) return { label: '—', color: 'neutral' };
  const now = new Date();
  const d = new Date(dateStr);
  const diff = d - now;
  const days = diff / (1000 * 60 * 60 * 24);
  if (diff < 0) return { label: 'Overdue', color: 'danger' };
  if (days < 2) return { label: 'Due soon', color: 'warning' };
  return { label: 'Upcoming', color: 'success' };
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cohorts', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.cohorts?.length) {
          const cohortId = data.cohorts[0].id;
          const aRes = await fetch(`/api/cohorts/${cohortId}/assignments`, { headers: getLmsAuthHeaders() });
          const aData = await aRes.json();
          if (aRes.ok && aData.assignments) setAssignments(aData.assignments);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '');

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
      <LmsPageHeader title="Assignments" subtitle="View and submit your cohort assignments." icon={LmsIcons.clipboard} />

      {/* Stats summary */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 'var(--lms-space-4)' }}>
          <div className="lms-stat-card">
            <div className="lms-stat-value">{assignments.length}</div>
            <div className="lms-stat-label">Total</div>
          </div>
          <div className="lms-stat-card">
            <div className="lms-stat-value" style={{ color: 'var(--red-600, #dc2626)' }}>
              {assignments.filter(a => a.deadline_at && new Date(a.deadline_at) < new Date()).length}
            </div>
            <div className="lms-stat-label">Past deadline</div>
          </div>
          <div className="lms-stat-card">
            <div className="lms-stat-value" style={{ color: 'var(--green-600, #16a34a)' }}>
              {assignments.filter(a => !a.deadline_at || new Date(a.deadline_at) >= new Date()).length}
            </div>
            <div className="lms-stat-label">Upcoming</div>
          </div>
        </div>
      )}

      <LmsCard title="All assignments" icon={LmsIcons.clipboard} hoverable={false}>
        {assignments.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.clipboard} title="No assignments in this cohort yet" description="Assignments will appear here when your facilitators add them." />
        ) : (
          <div className="lms-table-wrapper">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Week</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Max score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const ds = deadlineStatus(a.deadline_at);
                  return (
                    <tr key={a.id}>
                      <td className="font-medium" style={{ color: 'var(--neutral-900)' }}>{a.title}</td>
                      <td style={{ color: 'var(--neutral-600)' }}>{a.week_title ?? a.week_number}</td>
                      <td style={{ color: 'var(--neutral-600)' }}>{formatDate(a.deadline_at)}</td>
                      <td>
                        <span className={`lms-badge lms-badge-${ds.color}`}>{ds.label}</span>
                      </td>
                      <td style={{ color: 'var(--neutral-600)' }}>{a.max_score ?? 100}</td>
                      <td>
                        <Link href={`/dashboard/assignments/${a.id}`} className="lms-btn lms-btn-sm lms-btn-primary">
                          View
                        </Link>
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
