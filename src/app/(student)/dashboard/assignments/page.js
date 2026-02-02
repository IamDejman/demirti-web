'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentAssignmentsPage() {
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cohorts', { headers: getAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.cohorts?.length) {
          setCohorts(data.cohorts);
          const cohortId = data.cohorts[0].id;
          const aRes = await fetch(`/api/cohorts/${cohortId}/assignments`, { headers: getAuthHeaders() });
          const aData = await aRes.json();
          if (aRes.ok && aData.assignments) setAssignments(aData.assignments);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No assignments in this cohort yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Week</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Deadline</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Max score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 font-medium text-gray-900">{a.title}</td>
                  <td className="py-3 px-4 text-gray-600">{a.week_title ?? a.week_number}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(a.deadline_at)}</td>
                  <td className="py-3 px-4 text-gray-600">{a.max_score ?? 100}</td>
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/assignments/${a.id}`} className="text-primary font-medium hover:underline">
                      View / Submit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
