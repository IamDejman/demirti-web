'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
        const res = await fetch(`/api/weeks/${weekId}`, { headers: getAuthHeaders() });
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
          const aRes = await fetch(`/api/cohorts/${data.week.cohort_id}/assignments`, { headers: getAuthHeaders() });
          const aData = await aRes.json();
          if (aRes.ok && aData.assignments) {
            setAssignments(aData.assignments.filter((a) => a.week_id === weekId));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [weekId]);

  const handleCompleteChecklist = async (itemId) => {
    try {
      await fetch(`/api/checklist/${itemId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: '{}',
      });
      setChecklistItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, completed_at: new Date().toISOString() } : i)));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading week...</p>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Week not found.</p>
        <Link href="/dashboard" className="text-primary font-medium mt-4 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  if (week.locked) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600">This week is not yet unlocked.</p>
        <Link href="/dashboard" className="text-primary font-medium mt-4 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-primary text-sm font-medium">← Dashboard</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{week.title}</h1>
        {week.description && <p className="text-gray-600 mt-2">{week.description}</p>}
      </div>

      {week.live_class_datetime && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Live class</h2>
          <p className="text-sm text-gray-500 mt-1">{formatDate(week.live_class_datetime)}</p>
          {week.google_meet_link && (
            <a
              href={week.google_meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
              onClick={async () => {
                try {
                  await fetch(`/api/live-classes/${week.live_class_id}/join-click`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
              <a
                href={week.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline"
              >
                Watch recording
              </a>
            </div>
          )}
        </div>
      )}

      {checklistItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
          <ul className="mt-4 space-y-2">
            {checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCompleteChecklist(item.id)}
                  className={`h-5 w-5 rounded border flex items-center justify-center ${
                    item.completed_at ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-400'
                  }`}
                  aria-label="Toggle checklist item"
                >
                  {item.completed_at ? '✓' : ''}
                </button>
                <span className={`${item.completed_at ? 'line-through text-gray-500' : 'text-gray-900'}`}>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contentItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          <ul className="mt-4 space-y-3">
            {contentItems.map((item) => (
              <li key={item.id}>
                <span className="font-medium text-gray-900">{item.title}</span>
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm ml-2">Open</a>
                )}
                {item.external_url && (
                  <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm ml-2">Link</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {materials.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Materials</h2>
          <ul className="mt-4 space-y-2">
            {materials.map((m) => (
              <li key={m.id}>
                <span className="font-medium text-gray-900">{m.title}</span>
                {(m.url || m.file_url) && (
                  <a href={m.url || m.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm ml-2">Open</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
          <ul className="mt-4 space-y-3">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <Link href={`/dashboard/assignments/${a.id}`} className="font-medium text-primary hover:underline">
                  {a.title}
                </Link>
                <span className="text-sm text-gray-500">Due {formatDate(a.deadline_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
