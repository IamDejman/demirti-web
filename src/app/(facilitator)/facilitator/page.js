'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LmsCard, LmsEmptyState } from '@/app/components/lms';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
          fetch('/api/cohorts', { headers: getAuthHeaders() }),
          fetch('/api/facilitator/grading-queue', { headers: getAuthHeaders() }),
          fetch('/api/announcements?limit=5', { headers: getAuthHeaders() }),
          fetch('/api/notifications?limit=5', { headers: getAuthHeaders() }),
          fetch('/api/calendar', { headers: getAuthHeaders() }),
          fetch('/api/notifications/preferences', { headers: getAuthHeaders() }),
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
      <div className="space-y-8">
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="h-32 lms-skeleton rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 lms-skeleton rounded-xl" />
          <div className="h-40 lms-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
        <h1 className="text-2xl font-bold">Facilitator dashboard</h1>
        <p className="mt-1 text-white/90">Your cohorts and quick actions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/facilitator/grading" className="block">
          <LmsCard title="Grading queue">
            <p className="text-3xl font-bold text-primary mt-2">{pendingCount}</p>
            <p className="text-sm text-gray-500 mt-1">Pending submissions</p>
          </LmsCard>
        </Link>
        <Link href="/facilitator/attendance" className="block">
          <LmsCard title="Attendance">
            <p className="text-sm text-gray-600 mt-2">Mark attendance for live classes</p>
          </LmsCard>
        </Link>
      </div>

      <LmsCard title="Your cohorts" subtitle={`${cohorts.length} cohort${cohorts.length !== 1 ? 's' : ''} assigned`}>
        {cohorts.length === 0 ? (
          <LmsEmptyState title="No cohorts assigned yet" description="Contact an admin to get assigned to cohorts." />
        ) : (
          <ul className="space-y-3">
            {cohorts.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{c.track_name}</span>
                </div>
                <Link href={`/facilitator/cohorts/${c.id}`} className="text-primary text-sm font-medium hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </LmsCard>

      {events.length > 0 && (
        <LmsCard
          title="Upcoming events"
          action={
            <a href="/api/calendar/ics" className="text-sm font-medium text-primary hover:underline">
              Download .ics
            </a>
          }
        >
          <ul className="space-y-2">
            {events.slice(0, 5).map((ev) => (
              <li key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">{ev.title}</span>
                <span className="text-sm text-gray-500">{formatDate(ev.start)}</span>
              </li>
            ))}
          </ul>
        </LmsCard>
      )}

      {announcements.length > 0 && (
        <LmsCard title="Announcements">
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-medium text-gray-900">{a.title}</p>
                <p className="text-sm text-gray-500 mt-1">{a.body}</p>
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
            className="text-sm font-medium text-primary hover:underline"
            onClick={async () => {
              await fetch('/api/notifications/read-all', { method: 'POST', headers: getAuthHeaders() });
              setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            }}
          >
            Mark all read
          </button>
        }
      >
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className={`text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>{n.title}</span>
                {!n.is_read && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={async () => {
                      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST', headers: getAuthHeaders() });
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
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={prefs.in_app_enabled !== false}
              onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            In-app notifications
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={prefs.email_enabled !== false}
              onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Email notifications (Resend)
          </label>
          <button
            type="button"
            disabled={savingPrefs}
            onClick={async () => {
              setSavingPrefs(true);
              await fetch('/api/notifications/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                  inAppEnabled: prefs.in_app_enabled !== false,
                  emailEnabled: prefs.email_enabled !== false,
                }),
              });
              setSavingPrefs(false);
            }}
            className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {savingPrefs ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </LmsCard>
    </div>
  );
}
