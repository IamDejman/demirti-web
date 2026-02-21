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
        <div className="lms-skeleton rounded-xl" style={{ height: 320 }} />
        <div className="lms-skeleton rounded-xl" style={{ height: 140 }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Notifications"
        subtitle="Manage your notifications and preferences."
        icon={LmsIcons.bell}
      />

      <LmsCard
        title="Notifications"
        icon={LmsIcons.bell}
        action={
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
        }
      >
        {notifications.length === 0 ? (
          <p className="text-sm text-[var(--neutral-500)]">No notifications yet.</p>
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

      <LmsCard title="Notification preferences">
        <div className="flex flex-col" style={{ gap: 'var(--lms-space-5)' }}>
          {/* Master toggles */}
          <div className="flex flex-col gap-3">
            <label className="lms-toggle">
              <input
                type="checkbox"
                checked={prefs.in_app_enabled !== false}
                onChange={(e) => setPrefs((p) => ({ ...p, in_app_enabled: e.target.checked }))}
              />
              <span className="lms-toggle-track" />
              <span className="text-sm font-medium text-[var(--neutral-700)]">In-app notifications</span>
            </label>
            <label className="lms-toggle">
              <input
                type="checkbox"
                checked={prefs.email_enabled !== false}
                onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
              />
              <span className="lms-toggle-track" />
              <span className="text-sm font-medium text-[var(--neutral-700)]">Email notifications</span>
            </label>
          </div>

          {/* Category grids */}
          <div className="grid md:grid-cols-3 text-sm text-[var(--neutral-600)]" style={{ gap: 'var(--lms-space-4)' }}>
            <div className="lms-prefs-column">
              <div className="flex items-center gap-2 mb-4">
                <span className="lms-card-icon-box w-7 h-7 text-sm">{LmsIcons.bell}</span>
                <p className="lms-prefs-column-title">In-app</p>
              </div>
              {[['in_app_announcements', 'Announcements'], ['in_app_chat', 'Chat'], ['in_app_assignments', 'Assignments'], ['in_app_grades', 'Grades'], ['in_app_deadlines', 'Deadlines']].map(([key, label]) => (
                <label key={key} className="lms-toggle mt-2.5">
                  <input type="checkbox" checked={prefs[key] !== false} onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} />
                  <span className="lms-toggle-track" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="lms-prefs-column">
              <div className="flex items-center gap-2 mb-4">
                <span className="lms-card-icon-box w-7 h-7 text-sm">{LmsIcons.megaphone}</span>
                <p className="lms-prefs-column-title">Email</p>
              </div>
              {[['email_announcements', 'Announcements'], ['email_chat', 'Chat'], ['email_assignments', 'Assignments'], ['email_grades', 'Grades'], ['email_deadlines', 'Deadlines']].map(([key, label]) => (
                <label key={key} className="lms-toggle mt-2.5">
                  <input type="checkbox" checked={prefs[key] !== false} onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} />
                  <span className="lms-toggle-track" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="lms-prefs-column">
              <div className="flex items-center gap-2 mb-4">
                <span className="lms-card-icon-box w-7 h-7 text-sm">{LmsIcons.chat}</span>
                <p className="lms-prefs-column-title">Push</p>
              </div>
              {[['push_announcements', 'Announcements'], ['push_chat', 'Chat'], ['push_assignments', 'Assignments'], ['push_grades', 'Grades'], ['push_deadlines', 'Deadlines']].map(([key, label]) => (
                <label key={key} className="lms-toggle mt-2.5">
                  <input type="checkbox" checked={prefs[key] !== false} onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} />
                  <span className="lms-toggle-track" />
                  <span>{label}</span>
                </label>
              ))}
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
            className="lms-btn lms-btn-primary"
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
    </div>
  );
}
