'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PushToggle from '../../components/PushToggle';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
        const res = await fetch('/api/cohorts', { headers: getAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.cohorts?.length) {
          setCohorts(data.cohorts);
          const cohortId = data.cohorts[0].id;
          const [assignRes, weeksRes, progressRes] = await Promise.all([
            fetch(`/api/cohorts/${cohortId}/assignments`, { headers: getAuthHeaders() }),
            fetch(`/api/cohorts/${cohortId}/weeks`, { headers: getAuthHeaders() }),
            fetch(`/api/cohorts/${cohortId}/my-progress`, { headers: getAuthHeaders() }),
          ]);
          const assignData = await assignRes.json();
          const weeksData = await weeksRes.json();
          const progressData = await progressRes.json();
          if (assignRes.ok && assignData.assignments) setAssignments(assignData.assignments);
          if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
          if (progressRes.ok && progressData.progress) setProgress(progressData.progress);
        }
        const [annRes, notifRes, calRes, prefRes, certRes] = await Promise.all([
          fetch('/api/announcements?limit=5', { headers: getAuthHeaders() }),
          fetch('/api/notifications?limit=5', { headers: getAuthHeaders() }),
          fetch('/api/calendar', { headers: getAuthHeaders() }),
          fetch('/api/notifications/preferences', { headers: getAuthHeaders() }),
          fetch('/api/certificates', { headers: getAuthHeaders() }),
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
      } catch (e) {
        console.error(e);
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back. Here’s your learning overview.</p>
      </div>

      {!currentCohort ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">You’re not enrolled in any cohort yet.</p>
          <p className="text-sm text-gray-500 mt-2">Contact support or check the catalog for available tracks.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Current cohort</h2>
              <p className="text-primary font-medium mt-1">{currentCohort.name}</p>
              <p className="text-sm text-gray-500">{currentCohort.track_name}</p>
              {currentCohort.start_date && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(currentCohort.start_date)} – {formatDate(currentCohort.end_date)}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Week {currentCohort.current_week ?? 1} of 12
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
              <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((currentCohort.current_week ?? 1) / 12) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(((currentCohort.current_week ?? 1) / 12) * 100)}% complete
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Portfolio</h2>
              <p className="text-sm text-gray-600 mt-2">Build your public profile and showcase projects.</p>
              <Link
                href="/dashboard/portfolio"
                className="inline-block mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
              >
                Edit portfolio
              </Link>
            </div>
          </div>

          {currentWeek && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Current week</h2>
              <p className="text-primary font-medium mt-1">{currentWeek.title}</p>
              {currentWeek.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{currentWeek.description}</p>
              )}
              <Link
                href={`/dashboard/week/${currentWeek.id}`}
                className="inline-block mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
              >
                Go to week content
              </Link>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Checklist progress</h2>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {progress.completed_items} of {progress.total_items} completed ({completionPercent}%)
            </p>
          </div>

          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming deadlines</h2>
              <ul className="mt-4 space-y-2">
                {upcomingDeadlines.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900">{a.title}</span>
                    <span className="text-sm text-gray-500">{formatDate(a.deadline_at)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/assignments" className="text-primary text-sm font-medium mt-4 inline-block hover:underline">
                View all assignments
              </Link>
            </div>
          )}

          {events.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming events</h2>
                <a href="/api/calendar/ics" className="text-sm text-primary font-medium hover:underline">Download .ics</a>
              </div>
              <ul className="mt-4 space-y-2">
                {events.slice(0, 5).map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900">{ev.title}</span>
                    <span className="text-sm text-gray-500">{formatDate(ev.start)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {announcements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
              <ul className="mt-4 space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{a.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {certificates.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
              <ul className="mt-4 space-y-2">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-900">{c.track_name || 'CVERSE Academy'}</span>
                    <a href={`/api/certificates/${c.id}/pdf`} className="text-xs text-primary hover:underline">
                      Download PDF
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <button
                type="button"
                className="text-sm text-primary font-medium hover:underline"
                onClick={async () => {
                  await fetch('/api/notifications/read-all', { method: 'POST', headers: getAuthHeaders() });
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                }}
              >
                Mark all read
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">No notifications yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Notification preferences</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={prefs.in_app_enabled !== false}
                  onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
                />
                In-app notifications
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={prefs.email_enabled !== false}
                  onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
                />
                Email notifications (Resend)
              </label>
              <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-700">In-app categories</p>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.in_app_announcements !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, in_app_announcements: e.target.checked }))}
                    />
                    Announcements
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.in_app_chat !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, in_app_chat: e.target.checked }))}
                    />
                    Chat
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.in_app_assignments !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, in_app_assignments: e.target.checked }))}
                    />
                    Assignments
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.in_app_grades !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, in_app_grades: e.target.checked }))}
                    />
                    Grades
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.in_app_deadlines !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, in_app_deadlines: e.target.checked }))}
                    />
                    Deadlines
                  </label>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Email categories</p>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.email_announcements !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_announcements: e.target.checked }))}
                    />
                    Announcements
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.email_chat !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_chat: e.target.checked }))}
                    />
                    Chat
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.email_assignments !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_assignments: e.target.checked }))}
                    />
                    Assignments
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.email_grades !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_grades: e.target.checked }))}
                    />
                    Grades
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.email_deadlines !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_deadlines: e.target.checked }))}
                    />
                    Deadlines
                  </label>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Push categories</p>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.push_announcements !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_announcements: e.target.checked }))}
                    />
                    Announcements
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.push_chat !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_chat: e.target.checked }))}
                    />
                    Chat
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.push_assignments !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_assignments: e.target.checked }))}
                    />
                    Assignments
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.push_grades !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_grades: e.target.checked }))}
                    />
                    Grades
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={prefs.push_deadlines !== false}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_deadlines: e.target.checked }))}
                    />
                    Deadlines
                  </label>
                </div>
              </div>
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
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50"
              >
                {savingPrefs ? 'Saving...' : 'Save preferences'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Push notifications</h2>
            <p className="text-sm text-gray-600 mt-2">Enable browser push alerts. Use the category toggles above to fine-tune.</p>
            <div className="mt-4">
              <PushToggle />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
