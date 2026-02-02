'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentDashboardPage() {
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cohorts', { headers: getAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.cohorts?.length) {
          setCohorts(data.cohorts);
          const cohortId = data.cohorts[0].id;
          const [assignRes, weeksRes] = await Promise.all([
            fetch(`/api/cohorts/${cohortId}/assignments`, { headers: getAuthHeaders() }),
            fetch(`/api/cohorts/${cohortId}/weeks`, { headers: getAuthHeaders() }),
          ]);
          const assignData = await assignRes.json();
          const weeksData = await weeksRes.json();
          if (assignRes.ok && assignData.assignments) setAssignments(assignData.assignments);
          if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCohort = cohorts[0];
  const currentWeek = weeks.find((w) => !w.is_locked) || weeks[0];
  const upcomingDeadlines = assignments
    .filter((a) => a.deadline_at && new Date(a.deadline_at) > new Date())
    .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at))
    .slice(0, 5);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back. Here’s your learning overview.</p>
      </div>

      {!currentCohort ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">You’re not enrolled in any cohort yet.</p>
          <p className="text-sm text-gray-500 mt-2">Contact support or check the catalog for available tracks.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Current cohort</h2>
              <p className="text-primary font-medium mt-1">{currentCohort.name}</p>
              <p className="text-sm text-gray-500">{currentCohort.track_name}</p>
              {currentCohort.start_date && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(currentCohort.start_date)} – {formatDate(currentCohort.end_date)}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Week {currentCohort.current_week ?? 1} of 12
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
              <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((currentCohort.current_week ?? 1) / 12) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(((currentCohort.current_week ?? 1) / 12) * 100)}% complete
              </p>
            </div>
          </div>

          {currentWeek && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Current week</h2>
              <p className="text-primary font-medium mt-1">{currentWeek.title}</p>
              {currentWeek.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{currentWeek.description}</p>
              )}
              <Link
                href={`/dashboard/week/${currentWeek.id}`}
                className="inline-block mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
              >
                Go to week content
              </Link>
            </div>
          )}

          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming deadlines</h2>
              <ul className="mt-4 space-y-2">
                {upcomingDeadlines.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900">{a.title}</span>
                    <span className="text-sm text-gray-500">{formatDate(a.deadline_at)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/assignments" className="text-primary text-sm font-medium mt-4 inline-block hover:underline">
                View all assignments
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
