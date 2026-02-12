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
      <div className="space-y-8">
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title="Notifications"
        subtitle="Manage your notifications and preferences."
        icon={LmsIcons.bell}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

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
          <div className="mt-4 grid md:grid-cols-3 text-sm" style={{ color: 'var(--neutral-600)', gap: 'var(--lms-space-4)' }}>
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--neutral-200)' }}>
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
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--neutral-200)' }}>
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
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--neutral-200)' }}>
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
    </div>
  );
}
