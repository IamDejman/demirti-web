'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function StudentDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [progress, setProgress] = useState({ total_items: 0, completed_items: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cohorts', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.cohorts?.length) {
          setCohorts(data.cohorts);
          const cohortId = data.cohorts[0].id;
          const [assignRes, weeksRes, progressRes] = await Promise.all([
            fetch(`/api/cohorts/${cohortId}/assignments`, { headers: getLmsAuthHeaders() }),
            fetch(`/api/cohorts/${cohortId}/weeks`, { headers: getLmsAuthHeaders() }),
            fetch(`/api/cohorts/${cohortId}/my-progress`, { headers: getLmsAuthHeaders() }),
          ]);
          const assignData = await assignRes.json();
          const weeksData = await weeksRes.json();
          const progressData = await progressRes.json();
          if (assignRes.ok && assignData.assignments) setAssignments(assignData.assignments);
          if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
          if (progressRes.ok && progressData.progress) setProgress(progressData.progress);
        }
        const calRes = await fetch('/api/calendar', { headers: getLmsAuthHeaders() });
        const calData = await calRes.json();
        if (calRes.ok && calData.events) setEvents(calData.events);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCohort = cohorts[0];
  const currentWeek = weeks.find((w) => !w.is_locked) || weeks[0];
  const upcomingDeadlines = assignments
    .filter((a) => a.deadline_at && new Date(a.deadline_at) > new Date())
    .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at))
    .slice(0, 5);
  const completionPercent = progress.total_items
    ? Math.round((progress.completed_items / progress.total_items) * 100)
    : 0;
  const weekProgressPercent = currentCohort ? Math.min(100, ((currentCohort.current_week ?? 1) / 12) * 100) : 0;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  const now = new Date();
  const nextLiveClass = events
    .filter((ev) => ev.type === 'live_class' && new Date(ev.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0] ?? null;
  const dueSoon = events
    .filter((ev) => new Date(ev.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 7);

  if (loading) {
    return (
      <div className="flex flex-col rounded-lg" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="h-32 lms-skeleton rounded-xl" />
        <div className="grid md:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
          <div className="h-40 lms-skeleton rounded-xl" />
          <div className="h-40 lms-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Dashboard" subtitle="Welcome back. Here&apos;s your learning overview." />

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--lms-space-4)' }}>
            <LmsCard title="Current cohort" subtitle={currentCohort.track_name} icon={LmsIcons.graduation}>
              <p className="text-primary font-semibold">{currentCohort.name}</p>
              {currentCohort.start_date && (
                <p className="text-sm mt-1" style={{ color: 'var(--neutral-500)' }}>
                  {formatDate(currentCohort.start_date)} – {formatDate(currentCohort.end_date)}
                </p>
              )}
              <p className="text-sm mt-2" style={{ color: 'var(--neutral-600)' }}>Week {currentCohort.current_week ?? 1} of 12</p>
            </LmsCard>
            <LmsCard title="Course progress" icon={LmsIcons.chart}>
              <div className="mt-2 lms-progress-bar">
                <div
                  className="lms-progress-bar-fill"
                  style={{ width: `${weekProgressPercent}%` }}
                />
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>{Math.round(weekProgressPercent)}% complete</p>
            </LmsCard>
            <LmsCard title="Portfolio" subtitle="Build your public profile and showcase projects." icon={LmsIcons.briefcase}>
              <Link
                href="/dashboard/portfolio"
                className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Edit portfolio
              </Link>
            </LmsCard>
          </div>

          {weeks.length > 0 && (
            <LmsCard title="Course outline" subtitle="All weeks in your cohort." icon={LmsIcons.book}>
              <ul className="space-y-1 mt-2">
                {weeks.map((w) => {
                  const isCurrent = currentWeek?.id === w.id;
                  const isLocked = w.is_locked;
                  return (
                    <li key={w.id}>
                      <Link
                        href={isLocked ? '#' : `/dashboard/week/${w.id}`}
                        className={`flex items-center justify-between py-2 px-2 rounded-lg text-sm ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        onClick={(e) => isLocked && e.preventDefault()}
                      >
                        <span style={{ color: 'var(--neutral-900)' }}>
                          Week {w.week_number}: {w.title}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium text-primary">Current</span>
                        )}
                        {isLocked && !isCurrent && (
                          <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>Locked</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </LmsCard>
          )}

          {nextLiveClass && (
            <LmsCard
              title="Next class"
              subtitle={formatDateTime(nextLiveClass.start)}
              icon={LmsIcons.video}
            >
              <p className="font-medium mt-1" style={{ color: 'var(--neutral-900)' }}>{nextLiveClass.title}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--neutral-600)' }}>How to join: use the button below to open the meeting link.</p>
              {nextLiveClass.url ? (
                <a
                  href={nextLiveClass.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
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

          {currentWeek && (
            <LmsCard
              title="Current week"
              subtitle={currentWeek.description ? currentWeek.description.slice(0, 80) + (currentWeek.description.length > 80 ? '...' : '') : ''}
              action={
                <Link
                  href={`/dashboard/week/${currentWeek.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View
                </Link>
              }
            >
              <p className="font-medium" style={{ color: 'var(--neutral-900)' }}>{currentWeek.title}</p>
              <Link
                href={`/dashboard/week/${currentWeek.id}`}
                className="inline-flex items-center mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Go to week content
              </Link>
            </LmsCard>
          )}

          <LmsCard title="Checklist progress" icon={LmsIcons.checkCircle}>
            <div className="mt-2 lms-progress-bar">
              <div
                className="lms-progress-bar-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>
              {progress.completed_items} of {progress.total_items} completed ({completionPercent}%)
            </p>
          </LmsCard>

          <LmsCard
            title="Assignments"
            subtitle="Upcoming due dates."
            icon={LmsIcons.bell}
            action={
              <Link href="/dashboard/assignments" className="text-sm font-medium text-primary hover:underline">
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
                    <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(a.deadline_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </LmsCard>

          {dueSoon.length > 0 && (
            <LmsCard
              title="Due soon"
              subtitle="Assignments, classes, and office hours."
              icon={LmsIcons.calendar}
              action={
                <a href="/api/calendar/ics" className="text-sm font-medium text-primary hover:underline">
                  Download .ics
                </a>
              }
            >
              <ul className="space-y-2">
                {dueSoon.map((ev) => {
                  const typeLabel = ev.type === 'live_class' ? 'Live class' : ev.type === 'assignment' ? 'Assignment due' : 'Office hours';
                  const assignmentId = ev.type === 'assignment' ? ev.id.replace(/^assignment-/, '') : null;
                  const liveClassId = ev.type === 'live_class' ? ev.id.replace(/^live-/, '') : null;
                  return (
                    <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                      <div className="min-w-0">
                        <span className="text-xs font-medium" style={{ color: 'var(--neutral-500)' }}>{typeLabel}</span>
                        <p className="font-medium truncate" style={{ color: 'var(--neutral-900)' }}>{ev.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDateTime(ev.start)}</span>
                        {ev.type === 'assignment' && assignmentId && (
                          <Link href={`/dashboard/assignments/${assignmentId}`} className="text-sm font-medium text-primary hover:underline">
                            View
                          </Link>
                        )}
                        {ev.type === 'live_class' && ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
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
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
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
