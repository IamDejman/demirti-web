'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

export default function FacilitatorDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cohortsRes, queueRes, calRes] = await Promise.all([
          fetch('/api/cohorts', { headers: getLmsAuthHeaders() }),
          fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() }),
          fetch('/api/calendar', { headers: getLmsAuthHeaders() }),
        ]);
        const cohortsData = await cohortsRes.json();
        const queueData = await queueRes.json();
        const calData = await calRes.json();
        if (cohortsRes.ok && cohortsData.cohorts) setCohorts(cohortsData.cohorts);
        if (queueRes.ok && queueData.submissions) setPendingCount(queueData.submissions.length);
        if (calRes.ok && calData.events) setEvents(calData.events);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d) => formatTimeLagos(d);

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3" style={{ gap: 'var(--lms-space-4)' }}>
          <div className="h-28 lms-skeleton rounded-xl" />
          <div className="h-28 lms-skeleton rounded-xl" />
          <div className="h-28 lms-skeleton rounded-xl" />
        </div>
        <div className="grid md:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
          <div className="h-40 lms-skeleton rounded-xl" />
          <div className="h-40 lms-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Facilitator dashboard" subtitle="Your cohorts and quick actions." />

      {/* Stat cards row */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3" style={{ gap: 'var(--lms-space-4)' }}>
        <Link href="/facilitator/grading" className="block" style={{ textDecoration: 'none' }}>
          <div className="lms-stat-card">
            <div className="lms-stat-icon">{LmsIcons.grading}</div>
            <div className="lms-stat-value" style={{ color: pendingCount > 0 ? 'var(--primary-color)' : 'var(--neutral-400)' }}>{pendingCount}</div>
            <div className="lms-stat-label">Pending grades</div>
          </div>
        </Link>
        <Link href="/facilitator/attendance" className="block" style={{ textDecoration: 'none' }}>
          <div className="lms-stat-card">
            <div className="lms-stat-icon">{LmsIcons.users}</div>
            <div className="lms-stat-value">{cohorts.length}</div>
            <div className="lms-stat-label">Cohorts</div>
          </div>
        </Link>
        <div className="lms-stat-card">
          <div className="lms-stat-icon">{LmsIcons.calendar}</div>
          <div className="lms-stat-value">{events.length}</div>
          <div className="lms-stat-label">Upcoming events</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: 'var(--lms-space-6)', alignItems: 'start' }}>
        {/* Cohorts */}
        <LmsCard title="Your cohorts" subtitle={`${cohorts.length} cohort${cohorts.length !== 1 ? 's' : ''} assigned`} accent="primary">
          {cohorts.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.inbox} title="No cohorts assigned yet" description="Contact an admin to get assigned to cohorts." />
          ) : (
            <div>
              {cohorts.map((c) => (
                <div key={c.id} className="lms-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <span className="lms-row-item-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {c.track_name && <span className="lms-badge lms-badge-info" style={{ flexShrink: 0 }}>{c.track_name}</span>}
                  </div>
                  <Link href={`/facilitator/cohorts/${c.id}`} className="lms-btn lms-btn-sm lms-btn-outline" style={{ flexShrink: 0 }}>
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </LmsCard>

        {/* Upcoming events */}
        <LmsCard
          title="Upcoming events"
          accent="info"
          action={
            <a href="/api/calendar/ics" className="lms-btn lms-btn-sm lms-btn-outline">
              Download .ics
            </a>
          }
        >
          {events.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.calendar} title="No upcoming events" description="Events will appear here as they are scheduled." />
          ) : (
            <div>
              {events.slice(0, 5).map((ev) =>
                ev.url ? (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lms-list-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                      <span className="lms-list-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        {formatDate(ev.start)}{ev.meta?.cohort ? ` · ${ev.meta.cohort}` : ''}
                      </span>
                    </div>
                    <span className="lms-btn lms-btn-sm lms-btn-outline" style={{ flexShrink: 0 }}>Join ↗</span>
                  </a>
                ) : (
                  <div key={ev.id} className="lms-list-item">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                      <span className="lms-list-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        {formatDate(ev.start)}{ev.meta?.cohort ? ` · ${ev.meta.cohort}` : ''}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </LmsCard>
      </div>
    </div>
  );
}
