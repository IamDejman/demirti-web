'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import ClassroomTabs from '@/app/components/lms/ClassroomTabs';
import CohortOverviewTab from '@/app/components/lms/facilitator/CohortOverviewTab';
import CohortStudentsTab from '@/app/components/lms/facilitator/CohortStudentsTab';
import CohortAssignmentsTab from '@/app/components/lms/facilitator/CohortAssignmentsTab';
import CohortContentTab from '@/app/components/lms/facilitator/CohortContentTab';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LmsIcons.graduation },
  { id: 'students', label: 'Students', icon: LmsIcons.users },
  { id: 'assignments', label: 'Assignments', icon: LmsIcons.clipboard },
  { id: 'content', label: 'Content', icon: LmsIcons.book || LmsIcons.clipboard },
];

export default function FacilitatorCohortPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id;

  const activeTab = searchParams.get('tab') || 'overview';

  const [cohort, setCohort] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [cohortData, weeksData, studentsData, liveData, assignData] = await Promise.all([
        cohortRes.json(), weeksRes.json(), studentsRes.json(), liveRes.json(), assignRes.json(),
      ]);
      if (cohortRes.ok && cohortData.cohort) setCohort(cohortData.cohort);
      if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
      if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
      if (liveRes.ok && liveData.liveClasses) setLiveClasses(liveData.liveClasses);
      if (assignRes.ok && assignData.assignments) setAssignments(assignData.assignments);
    } catch {
      /* network error — keep defaults */
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

  const handleTabChange = (tabId) => {
    router.replace(`/facilitator/cohorts/${id}?tab=${tabId}`, { scroll: false });
  };

  const formatDate = (d) => formatTimeLagos(d);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-10 w-full lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  /* ── Not found ── */
  if (!cohort) {
    return (
      <LmsCard>
        <LmsEmptyState
          icon={LmsIcons.inbox}
          title="Cohort not found"
          description="You may not have access to this cohort or it no longer exists."
          action={<Link href="/facilitator" className="lms-btn lms-btn-sm lms-btn-outline">Back to dashboard</Link>}
        />
      </LmsCard>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      <LmsPageHeader
        title={cohort.name}
        subtitle={cohort.track_name}
        icon={LmsIcons.graduation}
        breadcrumb={{ href: '/facilitator', label: 'Dashboard' }}
      />

      <ClassroomTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'overview' && (
          <CohortOverviewTab cohort={cohort} weeks={weeks} liveClasses={liveClasses} formatDate={formatDate} onTabChange={handleTabChange} />
        )}
        {activeTab === 'students' && (
          <CohortStudentsTab students={students} />
        )}
        {activeTab === 'assignments' && (
          <CohortAssignmentsTab cohortId={id} weeks={weeks} assignments={assignments} onReload={reloadAssignments} />
        )}
        {activeTab === 'content' && (
          <CohortContentTab cohortId={id} weeks={weeks} />
        )}
      </ClassroomTabs>
    </div>
  );
}
