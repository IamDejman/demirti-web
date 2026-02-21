'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader, StreakCounter } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatDateLagos, formatTimeLagos } from '@/lib/dateUtils';
import { useFetch } from '@/hooks/useFetch';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function deadlineColor(date) {
  if (!date) return 'neutral';
  const diff = new Date(date) - new Date();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'danger';
  if (days < 2) return 'danger';
  if (days < 5) return 'warning';
  return 'success';
}

const DASHBOARD_GAP_STYLE = { gap: 'var(--lms-space-8)' };
const DASHBOARD_GAP_4_STYLE = { gap: 'var(--lms-space-4)' };

function deadlineLabel(date) {
  if (!date) return '';
  const diff = new Date(date) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
}

export default function StudentDashboardPage() {
  const { data: meData, isLoading: meLoading, error: meError } = useFetch('/api/auth/me');
  const { data: cohortsData, isLoading: cohortsLoading, error: cohortsError } = useFetch('/api/cohorts');
  const { data: calData, isLoading: calLoading, error: calError } = useFetch('/api/calendar');
  const cohortId = cohortsData?.cohorts?.[0]?.id;
  const { data: assignData } = useFetch(cohortId ? `/api/cohorts/${cohortId}/assignments` : null);
  const { data: weeksData } = useFetch(cohortId ? `/api/cohorts/${cohortId}/weeks` : null);
  const { data: streakData } = useFetch('/api/auth/streak');

  const cohorts = cohortsData?.cohorts ?? [];
  const assignments = assignData?.assignments ?? [];
  const weeks = weeksData?.weeks ?? [];
  const events = calData?.events ?? [];
  const userName = meData?.user?.firstName ?? '';
  const loading = meLoading || cohortsLoading || calLoading;
  const error = meError || cohortsError || calError;

  const currentCohort = cohorts[0];
  const currentWeek = useMemo(
    () => weeks.find((w) => !w.is_locked) || weeks[0],
    [weeks]
  );
  const upcomingDeadlines = useMemo(
    () =>
      assignments
        .filter((a) => a.deadline_at && new Date(a.deadline_at) > new Date())
        .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at))
        .slice(0, 5),
    [assignments]
  );
  const weekProgressPercent = useMemo(
    () => (currentCohort ? Math.min(100, ((currentCohort.current_week ?? 1) / 12) * 100) : 0),
    [currentCohort]
  );

  const formatDate = (d) => formatDateLagos(d);
  const formatDateTime = (d) => formatTimeLagos(d);

  const nextLiveClass = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => ev.type === 'live_class' && new Date(ev.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0] ?? null;
  }, [events]);
  const dueSoon = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => new Date(ev.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 7);
  }, [events]);

  if (loading) {
    return (
      <div className="flex flex-col rounded-lg" style={DASHBOARD_GAP_STYLE}>
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 lms-skeleton rounded-xl" />
          <div className="h-28 lms-skeleton rounded-xl" />
          <div className="h-28 lms-skeleton rounded-xl" />
        </div>
        <div className="h-48 lms-skeleton rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-40 lms-skeleton rounded-xl" />
          <div className="h-40 lms-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <LmsCard hoverable={false}>
        <LmsEmptyState
          icon={LmsIcons.inbox}
          title="Failed to load dashboard"
          description={error?.message || 'Something went wrong. Please try again.'}
        />
      </LmsCard>
    );
  }

  return (
    <div className="flex flex-col" style={DASHBOARD_GAP_STYLE}>
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="lms-greeting">{getGreeting()}{userName ? `, ${userName}` : ''} 👋</h1>
          <p className="lms-greeting-sub">Here&apos;s your learning overview.</p>
        </div>
        <StreakCounter
          currentStreak={streakData?.currentStreak ?? 0}
          longestStreak={streakData?.longestStreak}
        />
      </div>

      {!currentCohort ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState
            icon={LmsIcons.inbox}
            title="You're not enrolled in any cohort yet"
            description="Contact support or check the catalog for available tracks."
          />
        </LmsCard>
      ) : (
        <>
          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={DASHBOARD_GAP_4_STYLE}>
            <div className="lms-stat-card">
              <div className="lms-stat-icon">{LmsIcons.calendar}</div>
              <div className="lms-stat-value">Week {currentCohort.current_week ?? 1}</div>
              <div className="lms-stat-label">of 12 weeks</div>
            </div>
            <div className="lms-stat-card">
              <div className="lms-stat-icon">{LmsIcons.bell}</div>
              <div className="lms-stat-value">{upcomingDeadlines.length}</div>
              <div className="lms-stat-label">Upcoming deadlines</div>
            </div>
          </div>

          {/* Current cohort + portfolio row */}
          <div className="grid md:grid-cols-2" style={DASHBOARD_GAP_4_STYLE}>
            <LmsCard title="Current cohort" icon={LmsIcons.graduation}>
              <p className="font-semibold text-lg" style={{ color: 'var(--neutral-900)' }}>{currentCohort.name}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 min-w-0 lms-progress-bar">
                  <div className="lms-progress-bar-fill" style={{ width: `${weekProgressPercent}%` }} />
                </div>
                <span className="text-sm flex-shrink-0 tabular-nums" style={{ color: 'var(--neutral-500)' }}>{Math.round(weekProgressPercent)}%</span>
              </div>
            </LmsCard>

            <LmsCard title="Portfolio" subtitle="Build your public profile." icon={LmsIcons.briefcase}>
              <Link href="/dashboard/portfolio" className="lms-btn lms-btn-primary inline-flex items-center gap-2 w-fit" aria-label="Edit portfolio">
                Edit portfolio
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </LmsCard>
          </div>

          {/* Next live class */}
          {nextLiveClass && (
            <LmsCard
              title="Next class"
              subtitle={formatDateTime(nextLiveClass.start)}
              icon={LmsIcons.video}
              accent="info"
            >
              <p className="font-medium mt-1" style={{ color: 'var(--neutral-900)' }}>{nextLiveClass.title}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--neutral-600)' }}>Use the button below to open the meeting link.</p>
              {nextLiveClass.url ? (
                <a
                  href={nextLiveClass.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lms-btn lms-btn-primary lms-btn-sm mt-4"
                  onClick={async () => {
                    try {
                      const liveClassId = nextLiveClass.id.replace(/^live-/, '');
                      await fetch(`/api/live-classes/${liveClassId}/join-click`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                        body: '{}',
                      });
                    } catch {}
                  }}
                >
                  Join class
                </a>
              ) : (
                <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>Link will be shared by your facilitator.</p>
              )}
            </LmsCard>
          )}

          {/* Current week */}
          {currentWeek && (
            <LmsCard
              title="Current week"
              action={
                <Link href={`/dashboard/week/${currentWeek.id}`} className="lms-btn lms-btn-outline lms-btn-sm">
                  View
                </Link>
              }
            >
              <p className="font-medium" style={{ color: 'var(--neutral-900)' }}>{currentWeek.title}</p>
              {currentWeek.description && (
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--neutral-600)' }}>
                  {currentWeek.description.length > 160 ? currentWeek.description.slice(0, 160) + '...' : currentWeek.description}
                </p>
              )}
              <Link
                href={`/dashboard/week/${currentWeek.id}`}
                className="lms-btn lms-btn-primary lms-btn-sm mt-4"
              >
                Go to week content
              </Link>
            </LmsCard>
          )}

          {/* Course outline with timeline */}
          {weeks.length > 0 && (
            <LmsCard title="Course outline" subtitle="All weeks in your cohort." icon={LmsIcons.book}>
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

          {/* Assignments with deadline badges */}
          <LmsCard
            title="Assignments"
            subtitle="Upcoming due dates."
            icon={LmsIcons.bell}
            action={
              <Link href="/dashboard/assignments" className="lms-btn lms-btn-outline lms-btn-sm">
                View all
              </Link>
            }
          >
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm py-2" style={{ color: 'var(--neutral-500)' }}>No upcoming assignment deadlines.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingDeadlines.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                    <Link href={`/dashboard/assignments/${a.id}`} className="font-medium hover:underline" style={{ color: 'var(--neutral-900)' }}>
                      {a.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className={`lms-badge lms-badge-${deadlineColor(a.deadline_at)}`}>
                        {deadlineLabel(a.deadline_at)}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(a.deadline_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </LmsCard>

          {/* Due soon calendar */}
          {dueSoon.length > 0 && (
            <LmsCard
              title="Due soon"
              subtitle="Assignments, classes, and office hours."
              icon={LmsIcons.calendar}
              action={
                <a href="/api/calendar/ics" className="lms-btn lms-btn-outline lms-btn-sm">
                  Download .ics
                </a>
              }
            >
              <ul className="space-y-2">
                {dueSoon.map((ev) => {
                  const typeLabel = ev.type === 'live_class' ? 'Live class' : ev.type === 'assignment' ? 'Assignment due' : 'Office hours';
                  const typeBadge = ev.type === 'live_class' ? 'info' : ev.type === 'assignment' ? 'warning' : 'neutral';
                  const assignmentId = ev.type === 'assignment' ? ev.id.replace(/^assignment-/, '') : null;
                  const liveClassId = ev.type === 'live_class' ? ev.id.replace(/^live-/, '') : null;
                  return (
                    <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                      <div className="min-w-0">
                        <span className={`lms-badge lms-badge-${typeBadge} mb-1`}>{typeLabel}</span>
                        <p className="font-medium truncate" style={{ color: 'var(--neutral-900)' }}>{ev.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDateTime(ev.start)}</span>
                        {ev.type === 'assignment' && assignmentId && (
                          <Link href={`/dashboard/assignments/${assignmentId}`} className="lms-btn lms-btn-outline lms-btn-sm">
                            View
                          </Link>
                        )}
                        {ev.type === 'live_class' && ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lms-btn lms-btn-primary lms-btn-sm"
                            onClick={async () => {
                              try {
                                await fetch(`/api/live-classes/${liveClassId}/join-click`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                                  body: '{}',
                                });
                              } catch {}
                            }}
                          >
                            Join
                          </a>
                        )}
                        {ev.type === 'office_hours' && ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="lms-btn lms-btn-outline lms-btn-sm">
                            Join
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </LmsCard>
          )}
        </>
      )}
    </div>
  );
}
