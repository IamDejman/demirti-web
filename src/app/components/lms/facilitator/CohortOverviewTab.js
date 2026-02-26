'use client';

import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function CohortOverviewTab({ cohort, weeks, liveClasses, formatDate, onTabChange }) {
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
      <LmsCard title="Weeks" icon={LmsIcons.calendar} subtitle={`${weeks.length} week${weeks.length !== 1 ? 's' : ''} in curriculum`}>
        {weeks.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.calendar} title="No weeks configured" description="Weeks are managed in the admin cohort view." />
        ) : (
          <div>
            {weeks.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onTabChange?.('content')}
                className="lms-list-item"
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span className="lms-list-item-title">Week {w.week_number}: {w.title}</span>
                {w.is_locked && <LmsBadge variant="warning">Locked</LmsBadge>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
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
              lc.google_meet_link ? (
                <a
                  key={lc.id}
                  href={lc.google_meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lms-list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                    <span className="lms-list-item-title">{lc.week_title || 'Week'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{formatDate(lc.scheduled_at)}</span>
                  </div>
                  <LmsBadge variant="info">Join ↗</LmsBadge>
                </a>
              ) : (
                <div key={lc.id} className="lms-list-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                    <span className="lms-list-item-title">{lc.week_title || 'Week'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{formatDate(lc.scheduled_at)}</span>
                  </div>
                  <LmsBadge variant="neutral">No link</LmsBadge>
                </div>
              )
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
