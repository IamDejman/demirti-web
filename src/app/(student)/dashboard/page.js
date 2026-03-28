'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, StreakCounter } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos, formatDateLagos, formatClassTimeLagos } from '@/lib/dateUtils';
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
      <LmsCard>
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
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      {/* Hero greeting banner */}
      <div
        className="lms-dashboard-hero"
        style={{
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 50%, #1e88e5 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--lms-space-8) var(--lms-space-8)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="flex flex-wrap items-center justify-between gap-4" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#fff', marginBottom: '0.5rem' }}>
              {getGreeting()}{userName ? `, ${userName}` : ''} 👋
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.85, color: 'rgba(255,255,255,0.9)' }}>Here&apos;s what&apos;s happening today.</p>
          </div>
          <StreakCounter
            currentStreak={streakData?.currentStreak ?? 0}
            longestStreak={streakData?.longestStreak}
          />
        </div>
      </div>

      {!currentCohort ? (
        <LmsCard>
          <LmsEmptyState
            icon={LmsIcons.inbox}
            title="You're not enrolled in any cohort yet"
            description="Contact support or check the catalog for available tracks."
          />
        </LmsCard>
      ) : (
        <>
          {/* 2-column dashboard layout: main + sidebar */}
          <div
            className="lms-dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--lms-space-6)',
            }}
          >
            {/* Main column — activity feed */}
            <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)', order: 2 }}>
              {/* Next live class */}
              {nextLiveClass && (() => {
                const now = new Date();
                const startD = new Date(nextLiveClass.start);
                const endD = nextLiveClass.end ? new Date(nextLiveClass.end) : new Date(startD.getTime() + 2 * 60 * 60 * 1000);
                const isLive = now >= startD && now <= endD;
                return (
                  <LmsCard>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="lms-card-icon-box flex-shrink-0">{LmsIcons.video}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate" style={{ color: 'var(--neutral-900)' }}>{nextLiveClass.title}</p>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                              background: isLive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                              color: isLive ? 'var(--danger-color)' : 'var(--color-success)',
                              border: `1px solid ${isLive ? 'var(--danger-color)' : 'var(--color-success)'}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {isLive ? '● Live now' : '● Upcoming'}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>
                            {formatClassTimeLagos(nextLiveClass.start, nextLiveClass.end)}
                          </p>
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
                );
              })()}

              {/* Next assignment deadline */}
              {upcomingDeadlines.length > 0 && (
                <LmsCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="lms-card-icon-box flex-shrink-0">{LmsIcons.clipboard}</div>
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
                <LmsCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="lms-card-icon-box flex-shrink-0">{LmsIcons.megaphone}</div>
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
                <LmsCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="lms-card-icon-box flex-shrink-0">{LmsIcons.book}</div>
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

            {/* Sidebar — stats + progress */}
            <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)', order: 1 }}>
              {/* Progress card with visual bar */}
              <div
                className="lms-card"
                style={{
                  padding: 'var(--lms-space-6)',
                  borderLeft: '4px solid var(--primary-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--lms-space-4)' }}>
                  <h3 style={{ fontSize: 'var(--lms-title-sm)', fontWeight: 700, color: 'var(--neutral-900)' }}>Course Progress</h3>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>{Math.round(weekProgress)}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--neutral-100)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${weekProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--primary-light))', borderRadius: 999, transition: 'width 500ms ease' }} />
                </div>
                <p style={{ fontSize: 'var(--lms-caption)', color: 'var(--neutral-500)', marginTop: 'var(--lms-space-2)' }}>
                  Week {currentCohort.current_week ?? 1} of 12
                </p>
              </div>

              {/* 2x2 stat grid */}
              <div className="grid grid-cols-2" style={{ gap: 'var(--lms-space-3)' }}>
                <Link href="/dashboard/classroom?tab=weeks" className="lms-stat-card" style={{ textDecoration: 'none' }}>
                  <div className="lms-stat-icon">{LmsIcons.calendar}</div>
                  <div className="lms-stat-value">Week {currentCohort.current_week ?? 1}</div>
                  <div className="lms-stat-label">Current</div>
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
