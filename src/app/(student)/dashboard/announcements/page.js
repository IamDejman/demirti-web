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
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <LmsCard key={a.id} accent={i === 0 ? 'primary' : undefined} hoverable={false}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.1), rgba(0, 166, 126, 0.08))', color: 'var(--primary-color)' }}>
                  {LmsIcons.megaphone}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ color: 'var(--neutral-900)', fontSize: 'var(--lms-title-sm)' }}>{a.title}</h3>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--neutral-600)' }}>{a.body}</p>
                  {a.created_at && (
                    <p className="text-xs mt-3" style={{ color: 'var(--neutral-400)' }}>
                      {new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  )}
                </div>
              </div>
            </LmsCard>
          ))}
        </div>
      )}
    </div>
  );
}
