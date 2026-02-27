'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { getLmsAuthHeaders } from '@/lib/authClient';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/notifications', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.notifications) setNotifications(data.notifications);
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
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Notifications"
        subtitle="Your recent notifications."
      />

      <LmsCard
        title="Recent notifications"
        action={
          notifications.length > 0 ? (
            <div className="flex items-center gap-3">
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
              <button
                type="button"
                className="lms-link text-sm font-medium bg-transparent border-none cursor-pointer p-0 text-[var(--danger-600)]"
                onClick={async () => {
                  await fetch('/api/notifications/clear-all', { method: 'POST', headers: getLmsAuthHeaders() });
                  setNotifications([]);
                }}
              >
                Clear all
              </button>
            </div>
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
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    className="lms-link text-xs font-medium bg-transparent border-none cursor-pointer p-0 text-[var(--danger-600)]"
                    onClick={async () => {
                      const res = await fetch(`/api/notifications/${n.id}`, {
                        method: 'DELETE',
                        headers: getLmsAuthHeaders(),
                      });
                      if (res.ok) {
                        setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </LmsCard>
    </div>
  );
}
