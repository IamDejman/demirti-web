'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PushToggle from '../../components/PushToggle';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function StudentDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [progress, setProgress] = useState({ total_items: 0, completed_items: 0 });
  const [events, setEvents] = useState([]);
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    in_app_enabled: true,
    email_announcements: true,
    email_chat: true,
    email_assignments: true,
    email_grades: true,
    email_deadlines: true,
    in_app_announcements: true,
    in_app_chat: true,
    in_app_assignments: true,
    in_app_grades: true,
    in_app_deadlines: true,
    push_announcements: true,
    push_chat: true,
    push_assignments: true,
    push_grades: true,
    push_deadlines: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
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
        const [annRes, notifRes, calRes, prefRes, certRes] = await Promise.all([
          fetch('/api/announcements?limit=5', { headers: getLmsAuthHeaders() }),
          fetch('/api/notifications?limit=5', { headers: getLmsAuthHeaders() }),
          fetch('/api/calendar', { headers: getLmsAuthHeaders() }),
          fetch('/api/notifications/preferences', { headers: getLmsAuthHeaders() }),
          fetch('/api/certificates', { headers: getLmsAuthHeaders() }),
        ]);
        const annData = await annRes.json();
        const notifData = await notifRes.json();
        const calData = await calRes.json();
        const prefData = await prefRes.json();
        const certData = await certRes.json();
        if (annRes.ok && annData.announcements) setAnnouncements(annData.announcements);
        if (notifRes.ok && notifData.notifications) setNotifications(notifData.notifications);
        if (calRes.ok && calData.events) setEvents(calData.events);
        if (prefRes.ok && prefData.preferences) setPrefs(prefData.preferences);
        if (certRes.ok && certData.certificates) setCertificates(certData.certificates);
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

          {upcomingDeadlines.length > 0 && (
            <LmsCard
              title="Upcoming deadlines"
              icon={LmsIcons.bell}
              action={
                <Link href="/dashboard/assignments" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              }
            >
              <ul className="space-y-2">
                {upcomingDeadlines.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                    <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>{a.title}</span>
                    <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(a.deadline_at)}</span>
                  </li>
                ))}
              </ul>
            </LmsCard>
          )}

          {events.length > 0 && (
            <LmsCard
              title="Upcoming events"
              icon={LmsIcons.calendar}
              action={
                <a href="/api/calendar/ics" className="text-sm font-medium text-primary hover:underline">
                  Download .ics
                </a>
              }
            >
              <ul className="space-y-2">
                {events.slice(0, 5).map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                    <span className="font-medium" style={{ color: 'var(--neutral-900)' }}>{ev.title}</span>
                    <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>{formatDate(ev.start)}</span>
                  </li>
                ))}
              </ul>
            </LmsCard>
          )}

          {announcements.length > 0 && (
            <LmsCard title="Announcements" icon={LmsIcons.megaphone}>
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

          {certificates.length > 0 && (
            <LmsCard title="Certificates" icon={LmsIcons.trophy}>
              <ul className="space-y-2">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                    <span className="text-sm" style={{ color: 'var(--neutral-900)' }}>{c.track_name || 'CVERSE Academy'}</span>
                    <a href={`/api/certificates/${c.id}/pdf`} className="text-xs text-primary hover:underline">
                      Download PDF
                    </a>
                  </li>
                ))}
              </ul>
            </LmsCard>
          )}

          <LmsCard
            title="Notifications"
            icon={LmsIcons.bell}
            action={
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
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
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                    <span className={`text-sm ${n.is_read ? '' : 'font-medium'}`} style={{ color: n.is_read ? 'var(--neutral-500)' : 'var(--neutral-900)' }}>{n.title}</span>
                    {!n.is_read && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
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
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm lms-form-label" style={{ color: 'var(--neutral-700)' }}>
                <input
                  type="checkbox"
                  checked={prefs.in_app_enabled !== false}
                  onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                In-app notifications
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--neutral-700)' }}>
                <input
                  type="checkbox"
                  checked={prefs.email_enabled !== false}
                  onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Email notifications (Resend)
              </label>
              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm" style={{ color: 'var(--neutral-600)' }}>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded flex items-center justify-center">{LmsIcons.bell}</span>
                    <p className="font-semibold text-sm" style={{ color: 'var(--neutral-900)' }}>In-app</p>
                  </div>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.in_app_announcements !== false} onChange={(e) => setPrefs((p) => ({ ...p, in_app_announcements: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Announcements</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.in_app_chat !== false} onChange={(e) => setPrefs((p) => ({ ...p, in_app_chat: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Chat</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.in_app_assignments !== false} onChange={(e) => setPrefs((p) => ({ ...p, in_app_assignments: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Assignments</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.in_app_grades !== false} onChange={(e) => setPrefs((p) => ({ ...p, in_app_grades: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Grades</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.in_app_deadlines !== false} onChange={(e) => setPrefs((p) => ({ ...p, in_app_deadlines: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Deadlines</label>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded flex items-center justify-center">{LmsIcons.megaphone}</span>
                    <p className="font-semibold text-sm" style={{ color: 'var(--neutral-900)' }}>Email</p>
                  </div>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.email_announcements !== false} onChange={(e) => setPrefs((p) => ({ ...p, email_announcements: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Announcements</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.email_chat !== false} onChange={(e) => setPrefs((p) => ({ ...p, email_chat: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Chat</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.email_assignments !== false} onChange={(e) => setPrefs((p) => ({ ...p, email_assignments: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Assignments</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.email_grades !== false} onChange={(e) => setPrefs((p) => ({ ...p, email_grades: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Grades</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.email_deadlines !== false} onChange={(e) => setPrefs((p) => ({ ...p, email_deadlines: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Deadlines</label>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded flex items-center justify-center">{LmsIcons.chat}</span>
                    <p className="font-semibold text-sm" style={{ color: 'var(--neutral-900)' }}>Push</p>
                  </div>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.push_announcements !== false} onChange={(e) => setPrefs((p) => ({ ...p, push_announcements: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Announcements</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.push_chat !== false} onChange={(e) => setPrefs((p) => ({ ...p, push_chat: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Chat</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.push_assignments !== false} onChange={(e) => setPrefs((p) => ({ ...p, push_assignments: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Assignments</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.push_grades !== false} onChange={(e) => setPrefs((p) => ({ ...p, push_grades: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Grades</label>
                  <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={prefs.push_deadlines !== false} onChange={(e) => setPrefs((p) => ({ ...p, push_deadlines: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" /> Deadlines</label>
                </div>
              </div>
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
                      emailAnnouncements: prefs.email_announcements !== false,
                      emailChat: prefs.email_chat !== false,
                      emailAssignments: prefs.email_assignments !== false,
                      emailGrades: prefs.email_grades !== false,
                      emailDeadlines: prefs.email_deadlines !== false,
                      inAppAnnouncements: prefs.in_app_announcements !== false,
                      inAppChat: prefs.in_app_chat !== false,
                      inAppAssignments: prefs.in_app_assignments !== false,
                      inAppGrades: prefs.in_app_grades !== false,
                      inAppDeadlines: prefs.in_app_deadlines !== false,
                      pushAnnouncements: prefs.push_announcements !== false,
                      pushChat: prefs.push_chat !== false,
                      pushAssignments: prefs.push_assignments !== false,
                      pushGrades: prefs.push_grades !== false,
                      pushDeadlines: prefs.push_deadlines !== false,
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

          <LmsCard title="Push notifications" subtitle="Enable browser push alerts. Use the category toggles above to fine-tune.">
            <div className="mt-4">
              <PushToggle />
            </div>
          </LmsCard>
        </>
      )}
    </div>
  );
}
