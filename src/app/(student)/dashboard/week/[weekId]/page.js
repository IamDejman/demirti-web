'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

export default function WeekPage() {
  const params = useParams();
  const weekId = params?.weekId;
  const [week, setWeek] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weekId) return;
    (async () => {
      try {
        const res = await fetch(`/api/weeks/${weekId}`, { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 403) setWeek({ locked: true });
          return;
        }
        setWeek(data.week);
        setContentItems(data.contentItems || []);
        setMaterials(data.materials || []);
        setChecklistItems(data.checklistItems || []);
        if (data.week?.cohort_id) {
          const aRes = await fetch(`/api/cohorts/${data.week.cohort_id}/assignments`, { headers: getLmsAuthHeaders() });
          const aData = await aRes.json();
          if (aRes.ok && aData.assignments) {
            setAssignments(aData.assignments.filter((a) => a.week_id === weekId));
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [weekId]);

  const handleCompleteChecklist = async (itemId) => {
    try {
      await fetch(`/api/checklist/${itemId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: '{}',
      });
      setChecklistItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, completed_at: new Date().toISOString() } : i)));
    } catch {
    }
  };

  const formatDate = (d) => formatTimeLagos(d);

  if (loading) {
    return (
      <div className="flex flex-col gap-[var(--lms-space-6)]">
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  if (!week) {
    return (
      <LmsCard hoverable={false}>
        <LmsEmptyState icon={LmsIcons.inbox} title="Week not found" action={<Link href="/dashboard" className="lms-link">Back to dashboard</Link>} />
      </LmsCard>
    );
  }

  if (week.locked) {
    return (
      <LmsCard hoverable={false}>
        <LmsEmptyState icon={LmsIcons.lock} title="This week is not yet unlocked" action={<Link href="/dashboard" className="lms-link">Back to dashboard</Link>} />
      </LmsCard>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--lms-space-8)]">
      <LmsPageHeader
        title={week.title}
        subtitle={week.description}
        icon={LmsIcons.book}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      {week.live_class_datetime && (
        <LmsCard title="Live class" subtitle={formatDate(week.live_class_datetime)} icon={LmsIcons.video}>
          {week.google_meet_link && (
            <a
              href={week.google_meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="lms-btn lms-btn-primary mt-4"
              onClick={async () => {
                try {
                  await fetch(`/api/live-classes/${week.live_class_id}/join-click`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                    body: '{}',
                  });
                } catch {}
              }}
            >
              Join class
            </a>
          )}
          {week.recording_url && (
            <div className="mt-3">
              <a href={week.recording_url} target="_blank" rel="noopener noreferrer" className="lms-link text-sm">
                Watch recording
              </a>
            </div>
          )}
        </LmsCard>
      )}

      {checklistItems.length > 0 && (
        <LmsCard title="Checklist" icon={LmsIcons.checkCircle}>
          <ul className="mt-4 space-y-2">
            {checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCompleteChecklist(item.id)}
                  className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                    item.completed_at
                      ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                      : 'border-[var(--neutral-300)] text-[var(--neutral-400)]'
                  }`}
                  aria-label="Toggle checklist item"
                >
                  {item.completed_at ? '✓' : ''}
                </button>
                <span className={item.completed_at ? 'line-through text-[var(--neutral-500)]' : 'text-[var(--neutral-900)]'}>{item.title}</span>
              </li>
            ))}
          </ul>
        </LmsCard>
      )}

      {contentItems.length > 0 && (
        <LmsCard title="Content" icon={LmsIcons.book}>
            <ul className="mt-4 space-y-3">
              {contentItems.map((item) => (
                <li key={item.id} className="rounded-lg px-3 py-2 -mx-3 -my-1 transition-colors hover:bg-[var(--neutral-50)]">
                  <span className="font-medium text-[var(--neutral-900)]">{item.title}</span>
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="lms-link text-sm ml-2">Open</a>
                )}
                {item.external_url && (
                  <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="lms-link text-sm ml-2">Link</a>
                )}
              </li>
            ))}
          </ul>
        </LmsCard>
      )}

      {materials.length > 0 && (
        <LmsCard title="Materials" icon={LmsIcons.briefcase}>
            <ul className="mt-4 space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="rounded-lg px-3 py-2 -mx-3 -my-1 transition-colors hover:bg-[var(--neutral-50)]">
                <span className="font-medium text-[var(--neutral-900)]">{m.title}</span>
                {(m.url || m.file_url) && (
                  <a href={m.url || m.file_url} target="_blank" rel="noopener noreferrer" className="lms-link text-sm ml-2">Open</a>
                )}
              </li>
            ))}
          </ul>
        </LmsCard>
      )}

      {assignments.length > 0 && (
        <LmsCard title="Assignments" icon={LmsIcons.clipboard}>
          <ul className="mt-4 space-y-3">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 border-b last:border-0 border-[var(--neutral-100)]">
                <Link href={`/dashboard/assignments/${a.id}`} className="font-medium lms-link">
                  {a.title}
                </Link>
                <span className="text-sm text-[var(--neutral-500)]">Due {formatDate(a.deadline_at)}</span>
              </li>
            ))}
          </ul>
        </LmsCard>
      )}
    </div>
  );
}
