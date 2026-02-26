'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { useFetch } from '@/hooks/useFetch';
import ClassroomTabs from '@/app/components/lms/ClassroomTabs';
import WeeksTab from '@/app/components/lms/classroom/WeeksTab';
import AssignmentsTab from '@/app/components/lms/classroom/AssignmentsTab';
import OfficeHoursTab from '@/app/components/lms/classroom/OfficeHoursTab';
import AiAssistantTab from '@/app/components/lms/classroom/AiAssistantTab';

const TABS = [
  { id: 'weeks', label: 'Weeks', icon: LmsIcons.calendar },
  { id: 'assignments', label: 'Assignments', icon: LmsIcons.clipboard },
  { id: 'office-hours', label: 'Office Hours', icon: LmsIcons.clock },
  { id: 'ai-assistant', label: 'AI Assistant', icon: LmsIcons.sparkle },
];

export default function ClassroomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get('tab') || 'weeks';

  const handleTabChange = useCallback(
    (tabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.replace(`/dashboard/classroom?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /* Shared data: cohorts + weeks */
  const { data: cohortsData, isLoading: cohortsLoading } = useFetch('/api/cohorts');
  const cohortId = cohortsData?.cohorts?.[0]?.id;
  const { data: weeksData, isLoading: weeksLoading } = useFetch(cohortId ? `/api/cohorts/${cohortId}/weeks` : null);

  const weeks = weeksData?.weeks ?? [];
  const currentWeek = useMemo(
    () => weeks.find((w) => !w.is_locked) || weeks[0],
    [weeks]
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'weeks':
        return <WeeksTab weeks={weeks} loading={cohortsLoading || weeksLoading} />;
      case 'assignments':
        return <AssignmentsTab cohortId={cohortId} />;
      case 'office-hours':
        return <OfficeHoursTab />;
      case 'ai-assistant':
        return <AiAssistantTab contextWeekId={currentWeek?.id} />;
      default:
        return <WeeksTab weeks={weeks} loading={cohortsLoading || weeksLoading} />;
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      <LmsPageHeader
        title="Classroom"
        subtitle="Your learning hub — weeks, assignments, office hours, and AI assistant."
        icon={LmsIcons.graduation}
      />

      <ClassroomTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {renderTab()}
      </ClassroomTabs>
    </div>
  );
}
