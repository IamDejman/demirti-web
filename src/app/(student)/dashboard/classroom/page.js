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
    () => {
      const unlocked = weeks.filter((w) => !w.is_locked);
      return unlocked.length > 0 ? unlocked[unlocked.length - 1] : weeks[0] || null;
    },
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

  const completedWeeks = weeks.filter((w) => !w.is_locked && currentWeek && weeks.indexOf(w) < weeks.indexOf(currentWeek)).length;
  const totalWeeks = weeks.length || 12;
  const classroomProgress = Math.round((completedWeeks / totalWeeks) * 100);

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      <LmsPageHeader
        title="Classroom"
        subtitle="Your learning hub — weeks, assignments, office hours, and AI assistant."
        icon={LmsIcons.graduation}
      />

      {/* Progress banner */}
      {currentWeek && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 'var(--lms-space-6)',
            padding: 'var(--lms-space-5) var(--lms-space-6)',
            background: 'linear-gradient(135deg, var(--primary-50) 0%, #ffffff 100%)',
            border: '1px solid var(--primary-200)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--lms-space-3)', marginBottom: 'var(--lms-space-2)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,82,163,0.25)' }}>
                {LmsIcons.book}
              </div>
              <div>
                <p style={{ fontSize: 'var(--lms-body-sm)', fontWeight: 600, color: 'var(--neutral-900)' }}>Currently on: {currentWeek.title}</p>
                <p style={{ fontSize: 'var(--lms-caption)', color: 'var(--neutral-500)' }}>{completedWeeks} of {totalWeeks} weeks completed</p>
              </div>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--neutral-200)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(classroomProgress, 2)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--primary-light))', borderRadius: 999, transition: 'width 500ms ease' }} />
            </div>
          </div>
          <a href={`/dashboard/week/${currentWeek.id}`} className="lms-btn lms-btn-primary lms-btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Continue Learning
          </a>
        </div>
      )}

      <ClassroomTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {renderTab()}
      </ClassroomTabs>
    </div>
  );
}
