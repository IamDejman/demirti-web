'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../components/AdminNavbar';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [cohort, setCohort] = useState(null);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollMessage, setEnrollMessage] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const [cohortRes, studentsRes, appsRes] = await Promise.all([
          fetch(`/api/cohorts/${id}`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/students`, { headers: getAuthHeaders() }),
          fetch('/api/admin/applications?status=paid', { headers: getAuthHeaders() }),
        ]);
        const cohortData = await cohortRes.json();
        const studentsData = await studentsRes.json();
        const appsData = await appsRes.json();
        if (cohortRes.ok && cohortData.cohort) setCohort(cohortData.cohort);
        if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
        if (appsRes.ok && appsData.applications) setApplications(appsData.applications);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleEnrollByEmail = async (e) => {
    e.preventDefault();
    if (!enrollEmail?.trim()) return;
    setEnrolling(true);
    setEnrollMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: enrollEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.enrollment) {
        setEnrollMessage('Enrolled successfully.');
        setEnrollEmail('');
        const studentsRes = await fetch(`/api/cohorts/${id}/students`, { headers: getAuthHeaders() });
        const studentsData = await studentsRes.json();
        if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
      } else {
        setEnrollMessage(data.error || 'Enroll failed');
      }
    } catch (e) {
      setEnrollMessage('Something went wrong');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollFromApplication = async (app) => {
    setEnrolling(true);
    setEnrollMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          email: app.email,
          firstName: app.first_name,
          lastName: app.last_name,
          applicationId: app.application_id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.enrollment) {
        setEnrollMessage(`Enrolled ${app.email}`);
        const studentsRes = await fetch(`/api/cohorts/${id}/students`, { headers: getAuthHeaders() });
        const studentsData = await studentsRes.json();
        if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
      } else {
        setEnrollMessage(data.error || 'Enroll failed');
      }
    } catch (e) {
      setEnrollMessage('Something went wrong');
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

  if (loading) {
    return (
      <main className="admin-with-fixed-nav">
        <AdminNavbar />
        <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!cohort) {
    return (
      <main className="admin-with-fixed-nav">
        <AdminNavbar />
        <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <p className="text-gray-600">Cohort not found.</p>
          <Link href="/admin/cohorts" className="text-primary font-medium mt-4 inline-block">Back to cohorts</Link>
        </div>
      </main>
    );
  }

  const enrolledEmails = new Set(students.map((s) => s.email));
  const paidNotEnrolled = applications.filter((a) => a.status === 'paid' && !enrolledEmails.has(a.email));

  return (
    <main className="admin-with-fixed-nav">
      <AdminNavbar />
      <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Link href="/admin/cohorts" className="text-sm text-gray-500 hover:text-primary mb-4 inline-block">← Cohorts</Link>
        <h1 className="text-2xl font-bold text-gray-900">{cohort.name}</h1>
        <p className="text-gray-600 mt-1">{cohort.track_name} · {formatDate(cohort.start_date)} – {formatDate(cohort.end_date)} · {cohort.status}</p>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enroll student</h2>
          <form onSubmit={handleEnrollByEmail} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={enrollEmail}
                onChange={(e) => setEnrollEmail(e.target.value)}
                placeholder="student@example.com"
                className="mt-1 block w-64 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button type="submit" disabled={enrolling} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </button>
          </form>
          {enrollMessage && <p className="mt-2 text-sm text-gray-600">{enrollMessage}</p>}
        </div>

        {paidNotEnrolled.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enroll from paid applications</h2>
            <p className="text-sm text-gray-500 mb-4">Paid applicants not yet in this cohort:</p>
            <ul className="space-y-2">
              {paidNotEnrolled.slice(0, 20).map((app) => (
                <li key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">{app.first_name} {app.last_name}</span>
                  <span className="text-sm text-gray-500">{app.email}</span>
                  <span className="text-sm text-gray-500">{app.track_name}</span>
                  <button
                    type="button"
                    onClick={() => handleEnrollFromApplication(app)}
                    disabled={enrolling}
                    className="px-3 py-1 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark disabled:opacity-50"
                  >
                    Enroll
                  </button>
                </li>
              ))}
            </ul>
            {paidNotEnrolled.length > 20 && <p className="text-sm text-gray-500 mt-2">Showing first 20. Use email field above for others.</p>}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students ({students.length})</h2>
          {students.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                    <td className="py-3 px-4 text-gray-600">{s.email}</td>
                    <td className="py-3 px-4 text-gray-600">{s.status}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(s.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
