'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function FacilitatorDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cohortsRes, queueRes] = await Promise.all([
          fetch('/api/cohorts', { headers: getAuthHeaders() }),
          fetch('/api/facilitator/grading-queue', { headers: getAuthHeaders() }),
        ]);
        const cohortsData = await cohortsRes.json();
        const queueData = await queueRes.json();
        if (cohortsRes.ok && cohortsData.cohorts) setCohorts(cohortsData.cohorts);
        if (queueRes.ok && queueData.submissions) setPendingCount(queueData.submissions.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facilitator dashboard</h1>
        <p className="text-gray-600 mt-1">Your cohorts and quick actions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/facilitator/grading" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary transition-colors block">
          <h2 className="text-lg font-semibold text-gray-900">Grading queue</h2>
          <p className="text-3xl font-bold text-primary mt-2">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">Pending submissions</p>
        </Link>
        <Link href="/facilitator/attendance" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary transition-colors block">
          <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-500 mt-1">Mark attendance for live classes</p>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Your cohorts</h2>
        {cohorts.length === 0 ? (
          <p className="text-gray-500 mt-4">No cohorts assigned yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cohorts.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-sm text-gray-500">{c.track_name}</span>
                <Link href={`/facilitator/cohorts/${c.id}`} className="text-primary text-sm font-medium hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
