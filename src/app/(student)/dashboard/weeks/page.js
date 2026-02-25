'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { useFetch } from '@/hooks/useFetch';

export default function StudentWeeksPage() {
  const { data: cohortsData, isLoading: cohortsLoading } = useFetch('/api/cohorts');
  const cohortId = cohortsData?.cohorts?.[0]?.id;
  const { data: weeksData, isLoading: weeksLoading } = useFetch(cohortId ? `/api/cohorts/${cohortId}/weeks` : null);

  const weeks = weeksData?.weeks ?? [];
  const currentWeek = useMemo(
    () => weeks.find((w) => !w.is_locked) || weeks[0],
    [weeks]
  );

  const loading = cohortsLoading || weeksLoading;

  if (loading) {
    return (
      <div className="flex flex-col gap-[var(--lms-space-6)]">
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--lms-space-8)]">
      <LmsPageHeader
        title="Week"
        subtitle="All weeks in your cohort. Open any unlocked week to view content, materials, and assignments."
        breadcrumb={{ href: '/dashboard', label: 'Home' }}
      />

      {weeks.length === 0 ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState
            title="No weeks yet"
            description="Weeks will appear here when your cohort curriculum is set up."
            action={<Link href="/dashboard" className="lms-link">Back to Home</Link>}
          />
        </LmsCard>
      ) : (
        <LmsCard title="Course outline" subtitle="All weeks in your cohort.">
          <div className="space-y-1 mt-2">
            {weeks.map((w) => {
              const isCurrent = currentWeek?.id === w.id;
              const isLocked = w.is_locked;
              const isCompleted = !isLocked && !isCurrent && weeks.indexOf(w) < weeks.indexOf(currentWeek);
              return (
                <Link
                  key={w.id}
                  href={isLocked ? '#' : `/dashboard/week/${w.id}`}
                  className={`lms-timeline-item ${isLocked ? 'lms-timeline-locked' : ''}`}
                  onClick={(e) => isLocked && e.preventDefault()}
                >
                  <div className={`lms-timeline-dot ${isCurrent ? 'lms-timeline-dot-current' : ''} ${isCompleted ? 'lms-timeline-dot-completed' : ''}`}>
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      w.week_number
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: isLocked ? 'var(--neutral-400)' : 'var(--neutral-900)' }}>
                      {w.title}
                    </span>
                  </div>
                  {isCurrent && <span className="lms-badge lms-badge-info">Current</span>}
                  {isLocked && !isCurrent && <span className="lms-badge lms-badge-neutral">Locked</span>}
                  {isCompleted && <span className="lms-badge lms-badge-success">Done</span>}
                </Link>
              );
            })}
          </div>
        </LmsCard>
      )}
    </div>
  );
}
