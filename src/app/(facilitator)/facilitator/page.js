'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [prefs, setPrefs] = useState({ email_enabled: true, in_app_enabled: true });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cohortsRes, queueRes, annRes, notifRes, calRes, prefRes] = await Promise.all([
          fetch('/api/cohorts', { headers: getLmsAuthHeaders() }),
          fetch('/api/facilitator/grading-queue', { headers: getLmsAuthHeaders() }),
          fetch('/api/announcements?limit=5', { headers: getLmsAuthHeaders() }),
          fetch('/api/notifications?limit=5', { headers: getLmsAuthHeaders() }),
          fetch('/api/calendar', { headers: getLmsAuthHeaders() }),
          fetch('/api/notifications/preferences', { headers: getLmsAuthHeaders() }),
        ]);
        const cohortsData = await cohortsRes.json();
        const queueData = await queueRes.json();
        const annData = await annRes.json();
        const notifData = await notifRes.json();
        const calData = await calRes.json();
        const prefData = await prefRes.json();
        if (cohortsRes.ok && cohortsData.cohorts) setCohorts(cohortsData.cohorts);
        if (queueRes.ok && queueData.submissions) setPendingCount(queueData.submissions.length);
        if (annRes.ok && annData.announcements) setAnnouncements(annData.announcements);
        if (notifRes.ok && notifData.notifications) setNotifications(notifData.notifications);
        if (calRes.ok && calData.events) setEvents(calData.events);
        if (prefRes.ok && prefData.preferences) setPrefs(prefData.preferences);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
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
      <LmsPageHeader title="Facilitator dashboard" subtitle="Your cohorts and quick actions." />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 'var(--lms-space-4)' }}>
        <Link href="/facilitator/grading" className="block">
          <div className="lms-stat-card">
            <div className="lms-stat-icon">{LmsIcons.grading}</div>
            <div className="lms-stat-value" style={{ color: pendingCount > 0 ? 'var(--primary-color)' : 'var(--neutral-400)' }}>{pendingCount}</div>
            <div className="lms-stat-label">Pending grades</div>
          </div>
        </Link>
        <Link href="/facilitator/attendance" className="block">
          <div className="lms-stat-card">
            <div className="lms-stat-icon">{LmsIcons.users}</div>
            <div className="lms-stat-value">{cohorts.length}</div>
            <div className="lms-stat-label">Cohorts</div>
          </div>
        </Link>
        <div className="lms-stat-card">
          <div className="lms-stat-icon">{LmsIcons.bell}</div>
          <div className="lms-stat-value">{notifications.filter(n => !n.is_read).length}</div>
          <div className="lms-stat-label">Unread</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: 'var(--lms-space-6)' }}>
        {/* Cohorts */}
        <LmsCard title="Your cohorts" subtitle={`${cohorts.length} cohort${cohorts.length !== 1 ? 's' : ''} assigned`} accent="primary">
          {cohorts.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.inbox} title="No cohorts assigned yet" description="Contact an admin to get assigned to cohorts." />
          ) : (
            <ul className="space-y-1">
              {cohorts.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>{c.name}</span>
                    {c.track_name && <span className="lms-badge lms-badge-info">{c.track_name}</span>}
                  </div>
                  <Link href={`/facilitator/cohorts/${c.id}`} className="lms-btn lms-btn-sm lms-btn-outline">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </LmsCard>

        {/* Upcoming events */}
        {events.length > 0 && (
          <LmsCard
            title="Upcoming events"
            accent="info"
            action={
              <a href="/api/calendar/ics" className="lms-btn lms-btn-sm lms-btn-outline">
                Download .ics
              </a>
            }
          >
            <ul className="space-y-1">
              {events.slice(0, 5).map((ev) => (
                <li key={ev.id} className="flex items-center justify-between py-3 px-3 rounded-lg" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                  <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>{ev.title}</span>
                  <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(ev.start)}</span>
                </li>
              ))}
            </ul>
          </LmsCard>
        )}
      </div>

      {announcements.length > 0 && (
        <LmsCard title="Announcements" accent="warning">
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                <p className="font-medium" style={{ color: 'var(--neutral-900)' }}>{a.title}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--neutral-500)' }}>{a.body}</p>
              </li>
            ))}
          </ul>
        </LmsCard>
      )}

      <LmsCard
        title="Notifications"
        action={
          <button
            type="button"
            className="lms-btn lms-btn-sm lms-btn-outline"
            onClick={async () => {
              await fetch('/api/notifications/read-all', { method: 'POST', headers: getLmsAuthHeaders() });
              setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            }}
          >
            Mark all read
          </button>
        }
      >
        {notifications.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>No notifications yet.</p>
        ) : (
          <ul className="space-y-1">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors" style={{ backgroundColor: n.is_read ? 'transparent' : 'rgba(0, 82, 163, 0.03)', borderBottom: '1px solid var(--neutral-100)' }}>
                <div className="flex items-center gap-3">
                  {!n.is_read && <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }} />}
                  <span className={`text-sm ${n.is_read ? '' : 'font-medium'}`} style={{ color: n.is_read ? 'var(--neutral-500)' : 'var(--neutral-900)' }}>{n.title}</span>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    className="lms-btn lms-btn-sm lms-btn-outline"
                    onClick={async () => {
                      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST', headers: getLmsAuthHeaders() });
                      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
                    }}
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </LmsCard>

      <LmsCard title="Notification preferences">
        <div className="space-y-4">
          <label className="lms-toggle">
            <input
              type="checkbox"
              checked={prefs.in_app_enabled !== false}
              onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
            />
            <span className="lms-toggle-track" />
            <span className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>In-app notifications</span>
          </label>
          <label className="lms-toggle">
            <input
              type="checkbox"
              checked={prefs.email_enabled !== false}
              onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
            />
            <span className="lms-toggle-track" />
            <span className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>Email notifications</span>
          </label>
          <button
            type="button"
            disabled={savingPrefs}
            onClick={async () => {
              setSavingPrefs(true);
              await fetch('/api/notifications/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                body: JSON.stringify({
                  inAppEnabled: prefs.in_app_enabled !== false,
                  emailEnabled: prefs.email_enabled !== false,
                }),
              });
              setSavingPrefs(false);
            }}
            className="lms-btn lms-btn-primary"
          >
            {savingPrefs ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </LmsCard>
    </div>
  );
}
