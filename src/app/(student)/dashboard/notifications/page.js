'use client';

import { useState, useEffect } from 'react';
import PushToggle from '@/app/components/PushToggle';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

const defaultPrefs = {
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
};

const CATEGORIES = [
  { label: 'Announcements', keys: { in_app: 'in_app_announcements', email: 'email_announcements', push: 'push_announcements' } },
  { label: 'Chat', keys: { in_app: 'in_app_chat', email: 'email_chat', push: 'push_chat' } },
  { label: 'Assignments', keys: { in_app: 'in_app_assignments', email: 'email_assignments', push: 'push_assignments' } },
  { label: 'Grades', keys: { in_app: 'in_app_grades', email: 'email_grades', push: 'push_grades' } },
  { label: 'Deadlines', keys: { in_app: 'in_app_deadlines', email: 'email_deadlines', push: 'push_deadlines' } },
];

const CHANNELS = [
  { id: 'in_app', label: 'In-app' },
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [notifRes, prefRes] = await Promise.all([
          fetch('/api/notifications', { headers: getLmsAuthHeaders() }),
          fetch('/api/notifications/preferences', { headers: getLmsAuthHeaders() }),
        ]);
        const notifData = await notifRes.json();
        const prefData = await prefRes.json();
        if (notifRes.ok && notifData.notifications) setNotifications(notifData.notifications);
        if (prefRes.ok && prefData.preferences) setPrefs(prefData.preferences);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="lms-skeleton rounded-xl" style={{ height: 200 }} />
        <div className="lms-skeleton rounded-xl" style={{ height: 280 }} />
      </div>
    );
  }

  const handleSavePrefs = async () => {
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
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Notifications"
        subtitle="Manage your notifications and preferences."
      />

      {/* Notification list */}
      <LmsCard
        title="Recent notifications"
        action={
          notifications.length > 0 ? (
            <button
              type="button"
              className="lms-link text-sm font-medium bg-transparent border-none cursor-pointer p-0"
              onClick={async () => {
                await fetch('/api/notifications/read-all', { method: 'POST', headers: getLmsAuthHeaders() });
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
              }}
            >
              Mark all read
            </button>
          ) : null
        }
      >
        {notifications.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>No notifications yet.</p>
        ) : (
          <ul className="space-y-0">
            {notifications.map((n) => (
              <li key={n.id} className={`lms-notification-row ${!n.is_read ? 'lms-notification-row-unread' : ''}`}>
                <div className="flex items-center gap-3">
                  {!n.is_read && <span className="lms-notification-dot" />}
                  <span className={`text-sm ${n.is_read ? 'text-[var(--neutral-500)]' : 'font-medium text-[var(--neutral-900)]'}`}>{n.title}</span>
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

      {/* Preferences — matrix table + push toggle */}
      <LmsCard title="Preferences">
        <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
          {/* Master toggles */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="lms-toggle">
              <input
                type="checkbox"
                checked={prefs.in_app_enabled !== false}
                onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
              />
              <span className="lms-toggle-track" />
              <span className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>In-app</span>
            </label>
            <label className="lms-toggle">
              <input
                type="checkbox"
                checked={prefs.email_enabled !== false}
                onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
              />
              <span className="lms-toggle-track" />
              <span className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>Email</span>
            </label>
          </div>

          {/* Matrix table */}
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="text-left font-medium py-2 pr-4" style={{ color: 'var(--neutral-500)', minWidth: 120 }}>Category</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch.id} className="text-center font-medium py-2 px-3" style={{ color: 'var(--neutral-500)', minWidth: 70 }}>{ch.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat, i) => (
                  <tr key={cat.label}>
                    <td
                      className="py-2.5 pr-4 font-medium"
                      style={{
                        color: 'var(--neutral-700)',
                        borderTop: i > 0 ? '1px solid var(--neutral-100)' : 'none',
                      }}
                    >
                      {cat.label}
                    </td>
                    {CHANNELS.map((ch) => (
                      <td
                        key={ch.id}
                        className="text-center py-2.5 px-3"
                        style={{ borderTop: i > 0 ? '1px solid var(--neutral-100)' : 'none' }}
                      >
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs[cat.keys[ch.id]] !== false}
                            onChange={(e) => setPrefs((p) => ({ ...p, [cat.keys[ch.id]]: e.target.checked }))}
                            className="lms-checkbox"
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Push notifications toggle */}
          <div
            className="flex items-center justify-between rounded-lg"
            style={{
              padding: 'var(--lms-space-4)',
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-100)',
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>Browser push notifications</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--neutral-500)' }}>Get alerts even when the tab is closed</p>
            </div>
            <PushToggle />
          </div>

          <button
            type="button"
            disabled={savingPrefs}
            onClick={handleSavePrefs}
            className="lms-btn lms-btn-primary self-start"
          >
            {savingPrefs ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </LmsCard>
    </div>
  );
}
