'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/announcements?limit=50', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.announcements) setAnnouncements(data.announcements);
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
        title="Announcements"
        subtitle="Updates and news from your facilitators."
        icon={LmsIcons.megaphone}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      {announcements.length === 0 ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState
            icon={LmsIcons.megaphone}
            title="No announcements yet"
            description="Check back later for updates from your cohort."
          />
        </LmsCard>
      ) : (
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
    </div>
  );
}
