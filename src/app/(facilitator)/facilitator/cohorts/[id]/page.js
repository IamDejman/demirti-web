'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorCohortPage() {
  const params = useParams();
  const id = params?.id;
  const [cohort, setCohort] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
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
    })();
  }, [id]);

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title={cohort.name}
        subtitle={cohort.track_name}
        icon={LmsIcons.graduation}
        breadcrumb={{ href: '/facilitator', label: 'Dashboard' }}
      >
        {cohort.start_date && (
          <p className="text-sm text-white/80 mt-2">
            {formatDate(cohort.start_date)} – {formatDate(cohort.end_date)}
          </p>
        )}
      </LmsPageHeader>

      <div className="grid gap-4 md:grid-cols-2">
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
              className="inline-flex items-center px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
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
        action={
          <span className="text-sm text-gray-500">Read-only</span>
        }
      >
        {weeks.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.calendar} title="No weeks configured" description="Weeks are managed in the admin cohort view." />
        ) : (
          <ul className="space-y-2">
            {weeks.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">Week {w.week_number}: {w.title}</span>
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
              <li key={lc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">{lc.week_title || 'Week'}</span>
                <span className="text-sm text-gray-500">{formatDate(lc.scheduled_at)}</span>
              </li>
            ))}
            {liveClasses.length > 5 && <p className="text-sm text-gray-500 mt-2">+{liveClasses.length - 5} more</p>}
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
                    <td className="font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                    <td className="text-gray-600">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 20 && <p className="text-sm text-gray-500 mt-2">+{students.length - 20} more</p>}
          </div>
        )}
      </LmsCard>

      <LmsCard
        title="Assignments"
        subtitle={`${assignments.length} total`}
        icon={LmsIcons.clipboard}
      >
        {assignments.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.clipboard} title="No assignments" description="Assignments are created per week in the admin cohort view." />
        ) : (
          <ul className="space-y-2">
            {assignments.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">{a.title}</span>
                <span className="text-sm text-gray-500">Week {a.week_title ?? a.week_number}</span>
              </li>
            ))}
            {assignments.length > 5 && <p className="text-sm text-gray-500 mt-2">+{assignments.length - 5} more</p>}
          </ul>
        )}
      </LmsCard>
    </div>
  );
}
