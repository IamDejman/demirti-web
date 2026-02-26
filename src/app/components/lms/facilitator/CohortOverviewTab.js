'use client';

import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function CohortOverviewTab({ cohort, weeks, liveClasses, formatDate }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      {/* Quick actions */}
      <LmsCard title="Quick actions" hoverable={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/facilitator/grading" className="lms-btn lms-btn-sm lms-btn-primary">
            Grading queue
          </Link>
          <Link href="/facilitator/attendance" className="lms-btn lms-btn-sm lms-btn-primary">
            Attendance
          </Link>
          <Link href="/facilitator/office-hours" className="lms-btn lms-btn-sm lms-btn-primary">
            Office Hours
          </Link>
        </div>
      </LmsCard>

      {/* Cohort info */}
      {cohort.start_date && (
        <LmsCard title="Cohort details" hoverable={false}>
          <div className="flex flex-col" style={{ gap: '0.5rem' }}>
            <div className="lms-row-item">
              <span className="lms-row-item-name">Track</span>
              <span className="lms-row-item-detail">{cohort.track_name || '—'}</span>
            </div>
            <div className="lms-row-item">
              <span className="lms-row-item-name">Start</span>
              <span className="lms-row-item-detail">{formatDate(cohort.start_date)}</span>
            </div>
            {cohort.end_date && (
              <div className="lms-row-item">
                <span className="lms-row-item-name">End</span>
                <span className="lms-row-item-detail">{formatDate(cohort.end_date)}</span>
              </div>
            )}
          </div>
        </LmsCard>
      )}

      {/* Weeks */}
      <LmsCard title="Weeks" icon={LmsIcons.calendar} subtitle={`${weeks.length} weeks in curriculum`}>
        {weeks.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.calendar} title="No weeks configured" description="Weeks are managed in the admin cohort view." />
        ) : (
          <div>
            {weeks.map((w) => (
              <div key={w.id} className="lms-row-item">
                <span className="lms-row-item-name">Week {w.week_number}: {w.title}</span>
                {w.is_locked && <LmsBadge variant="warning">Locked</LmsBadge>}
              </div>
            ))}
          </div>
        )}
      </LmsCard>

      {/* Live classes */}
      <LmsCard title="Live classes" subtitle={`${liveClasses.length} scheduled`} icon={LmsIcons.video}>
        {liveClasses.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.video} title="No live classes" description="Live classes are scheduled per week in the admin cohort view." />
        ) : (
          <div>
            {liveClasses.slice(0, 10).map((lc) => (
              <div key={lc.id} className="lms-row-item">
                <span className="lms-row-item-name">{lc.week_title || 'Week'}</span>
                <span className="lms-row-item-detail">{formatDate(lc.scheduled_at)}</span>
              </div>
            ))}
            {liveClasses.length > 10 && (
              <p className="lms-row-item-detail" style={{ padding: '0.5rem 0.75rem' }}>+{liveClasses.length - 10} more</p>
            )}
          </div>
        )}
      </LmsCard>
    </div>
  );
}
