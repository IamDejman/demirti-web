'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LmsEmptyState } from '@/app/components/lms';

export default function WeeksTab({ weeks = [], loading = false }) {
  const currentWeek = useMemo(
    () => weeks.find((w) => !w.is_locked) || weeks[0],
    [weeks]
  );

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
        <div className="h-12 lms-skeleton rounded-lg" />
        <div className="h-12 lms-skeleton rounded-lg" />
        <div className="h-12 lms-skeleton rounded-lg" />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <LmsEmptyState
        title="No weeks yet"
        description="Weeks will appear here when your cohort curriculum is set up."
        action={<Link href="/dashboard" className="lms-btn lms-btn-sm lms-btn-outline">Back to Home</Link>}
      />
    );
  }

  return (
    <div className="space-y-1">
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
  );
}
