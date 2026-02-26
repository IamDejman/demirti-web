'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, StreakCounter } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos, formatDateLagos } from '@/lib/dateUtils';
import { useFetch } from '@/hooks/useFetch';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function deadlineLabel(date) {
  if (!date) return '';
  const diff = new Date(date) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
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

export default function StudentDashboardPage() {
  const { data: meData, isLoading: meLoading, error: meError } = useFetch('/api/auth/me');
  const { data: cohortsData, isLoading: cohortsLoading, error: cohortsError } = useFetch('/api/cohorts');
  const { data: calData } = useFetch('/api/calendar');
  const { data: streakData } = useFetch('/api/auth/streak');
  const { data: announcementsData } = useFetch('/api/announcements');

  const cohortId = cohortsData?.cohorts?.[0]?.id;
  const { data: assignData } = useFetch(cohortId ? `/api/cohorts/${cohortId}/assignments` : null);
  const { data: weeksData } = useFetch(cohortId ? `/api/cohorts/${cohortId}/weeks` : null);

  const cohorts = cohortsData?.cohorts ?? [];
  const assignments = assignData?.assignments ?? [];
  const weeks = weeksData?.weeks ?? [];
  const events = calData?.events ?? [];
  const announcements = announcementsData?.announcements ?? [];
  const userName = meData?.user?.firstName ?? '';
  const loading = meLoading || cohortsLoading;
  const error = meError || cohortsError;

  const currentCohort = cohorts[0];
  const currentWeek = useMemo(
    () => weeks.find((w) => !w.is_locked) || weeks[0],
    [weeks]
  );
  const upcomingDeadlines = useMemo(
    () =>
      assignments
        .filter((a) => a.deadline_at && new Date(a.deadline_at) > new Date())
        .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at)),
    [assignments]
  );
  const nextLiveClass = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => ev.type === 'live_class' && new Date(ev.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0] ?? null;
  }, [events]);
  const latestAnnouncement = announcements[0] ?? null;

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 lms-skeleton rounded-xl" />
          <div className="h-24 lms-skeleton rounded-xl" />
          <div className="h-24 lms-skeleton rounded-xl" />
          <div className="h-24 lms-skeleton rounded-xl" />
        </div>
        <div className="h-40 lms-skeleton rounded-xl" />
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

  const weekProgress = currentCohort
    ? Math.min(100, ((currentCohort.current_week ?? 1) / 12) * 100)
    : 0;

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      {/* Greeting row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="lms-greeting">{getGreeting()}{userName ? `, ${userName}` : ''} 👋</h1>
          <p className="lms-greeting-sub">Here&apos;s what&apos;s happening today.</p>
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
          {/* 4 stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'var(--lms-space-4)' }}>
            <Link href="/dashboard/classroom?tab=weeks" className="lms-stat-card" style={{ textDecoration: 'none' }}>
              <div className="lms-stat-icon">{LmsIcons.calendar}</div>
              <div className="lms-stat-value">Week {currentCohort.current_week ?? 1}</div>
              <div className="lms-stat-label">of 12 weeks</div>
            </Link>
            <Link href="/dashboard/classroom?tab=assignments" className="lms-stat-card" style={{ textDecoration: 'none' }}>
              <div className="lms-stat-icon">{LmsIcons.clipboard}</div>
              <div className="lms-stat-value">{upcomingDeadlines.length}</div>
              <div className="lms-stat-label">Due soon</div>
            </Link>
            <div className="lms-stat-card">
              <div className="lms-stat-icon">{LmsIcons.sparkle}</div>
              <div className="lms-stat-value">{streakData?.currentStreak ?? 0}d</div>
              <div className="lms-stat-label">Streak</div>
            </div>
            <div className="lms-stat-card">
              <div className="lms-stat-icon">{LmsIcons.graduation}</div>
              <div className="lms-stat-value">{Math.round(weekProgress)}%</div>
              <div className="lms-stat-label">Progress</div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
            {/* Next live class */}
            {nextLiveClass && (
              <LmsCard accent="info" hoverable={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="lms-card-icon-box w-10 h-10 flex-shrink-0">{LmsIcons.video}</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--neutral-900)' }}>{nextLiveClass.title}</p>
                      <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatTimeLagos(nextLiveClass.start)}</p>
                    </div>
                  </div>
                  {nextLiveClass.url ? (
                    <a
                      href={nextLiveClass.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lms-btn lms-btn-primary lms-btn-sm flex-shrink-0"
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
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--neutral-400)' }}>Link coming soon</span>
                  )}
                </div>
              </LmsCard>
            )}

            {/* Next assignment deadline */}
            {upcomingDeadlines.length > 0 && (
              <LmsCard hoverable={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="lms-card-icon-box w-10 h-10 flex-shrink-0">{LmsIcons.clipboard}</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--neutral-900)' }}>{upcomingDeadlines[0].title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`lms-badge lms-badge-${deadlineColor(upcomingDeadlines[0].deadline_at)}`}>
                          {deadlineLabel(upcomingDeadlines[0].deadline_at)}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDateLagos(upcomingDeadlines[0].deadline_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/classroom?tab=assignments" className="lms-btn lms-btn-outline lms-btn-sm flex-shrink-0">
                    View all
                  </Link>
                </div>
              </LmsCard>
            )}

            {/* Latest announcement */}
            {latestAnnouncement && (
              <LmsCard hoverable={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="lms-card-icon-box w-10 h-10 flex-shrink-0">{LmsIcons.megaphone}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate" style={{ color: 'var(--neutral-900)' }}>{latestAnnouncement.title}</p>
                      {latestAnnouncement.body && (
                        <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--neutral-600)' }}>
                          {latestAnnouncement.body.length > 100 ? latestAnnouncement.body.slice(0, 100) + '…' : latestAnnouncement.body}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href="/dashboard/announcements" className="lms-btn lms-btn-outline lms-btn-sm flex-shrink-0">
                    View all
                  </Link>
                </div>
              </LmsCard>
            )}

            {/* Current week quick link */}
            {currentWeek && (
              <LmsCard hoverable={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="lms-card-icon-box w-10 h-10 flex-shrink-0">{LmsIcons.book}</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--neutral-900)' }}>{currentWeek.title}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--neutral-500)' }}>Current week</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/week/${currentWeek.id}`} className="lms-btn lms-btn-primary lms-btn-sm flex-shrink-0">
                    Continue
                  </Link>
                </div>
              </LmsCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}
