'use client';

import { useEffect } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { useFetch } from '@/hooks/useFetch';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatDateLagos } from '@/lib/dateUtils';

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useFetch('/api/announcements?limit=50');
  const announcements = data?.announcements ?? [];

  // Mark all visible announcements as read when page loads
  useEffect(() => {
    if (announcements.length > 0) {
      const ids = announcements.map((a) => a.id);
      fetch('/api/announcements/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ announcementIds: ids }),
      }).catch(() => {});
    }
  }, [announcements]);

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="h-32 lms-skeleton rounded-xl" />
        <div className="h-32 lms-skeleton rounded-xl" />
        <div className="h-32 lms-skeleton rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <LmsPageHeader title="Announcements" />
        <LmsCard hoverable={false}>
          <LmsEmptyState
            icon={LmsIcons.megaphone}
            title="Failed to load announcements"
            description={error?.message || 'Something went wrong. Please try again.'}
          />
        </LmsCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Announcements" />

      {announcements.length === 0 ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState
            icon={LmsIcons.megaphone}
            title="No announcements yet"
            description="Check back later for updates from your cohort."
          />
        </LmsCard>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
          {announcements.map((a, i) => (
            <LmsCard key={a.id} accent={i === 0 ? 'primary' : undefined} hoverable={false}>
              <div className="flex items-start gap-4">
                <div className="lms-card-icon-box">
                  {LmsIcons.megaphone}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--neutral-900)]" style={{ fontSize: 'var(--lms-title-sm)' }}>{a.title}</h3>
                  <p className="text-sm mt-1.5 leading-relaxed text-[var(--neutral-600)]">{a.body}</p>
                  {a.created_at && (
                    <p className="text-xs mt-3 text-[var(--neutral-400)]">
                      {formatDateLagos(a.created_at)}
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
