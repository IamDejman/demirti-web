'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

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
      <LmsPageHeader title="Assignments" subtitle="View and submit your cohort assignments." icon={LmsIcons.clipboard} />
      <LmsCard title="Assignments" icon={LmsIcons.clipboard} hoverable={false}>
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
                  <th>Max score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-gray-900">{a.title}</td>
                    <td className="text-gray-600">{a.week_title ?? a.week_number}</td>
                    <td className="text-gray-600">{formatDate(a.deadline_at)}</td>
                    <td className="text-gray-600">{a.max_score ?? 100}</td>
                    <td>
                      <Link href={`/dashboard/assignments/${a.id}`} className="text-primary font-medium hover:underline">
                        View / Submit
                      </Link>
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
