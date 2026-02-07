'use client';

import { useState, useEffect } from 'react';
import { LmsCard } from '@/app/components/lms';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorAttendancePage() {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/cohorts', { headers: getLmsAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.cohorts) setCohorts(data.cohorts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCohort) {
      setLiveClasses([]);
      setSelectedClass(null);
      return;
    }
    fetch(`/api/cohorts/${selectedCohort}/live-classes`, { headers: getLmsAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.liveClasses) {
          setLiveClasses(data.liveClasses.map((lc) => ({ id: lc.id, weekTitle: lc.week_title, scheduledAt: lc.scheduled_at })));
        } else setLiveClasses([]);
      });
  }, [selectedCohort]);

  useEffect(() => {
    if (!selectedClass) {
      setAttendance([]);
      return;
    }
    fetch(`/api/live-classes/${selectedClass}/attendance`, { headers: getLmsAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.attendance) setAttendance(data.attendance);
      });
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const updates = attendance.map((r) => ({ studentId: r.student_id, status: r.status }));
      await fetch(`/api/live-classes/${selectedClass}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ updates }),
      });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Mark attendance for live classes.</p>
      </div>
      <LmsCard title="Select cohort">
        <label className="block text-sm font-medium text-gray-700">Cohort</label>
        <select
          value={selectedCohort || ''}
          onChange={(e) => { setSelectedCohort(e.target.value || null); setSelectedClass(null); }}
          className="lms-form-select mt-1 block w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select cohort</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </LmsCard>
      {liveClasses.length > 0 && (
        <LmsCard title="Select live class">
          <label className="block text-sm font-medium text-gray-700">Live class</label>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value || null)}
            className="lms-form-select mt-1 block w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select class</option>
            {liveClasses.map((lc) => (
              <option key={lc.id} value={lc.id}>{lc.weekTitle} – {formatDate(lc.scheduledAt)}</option>
            ))}
          </select>
        </LmsCard>
      )}
      {selectedClass && attendance.length > 0 && (
        <LmsCard title="Mark attendance">
          <ul className="space-y-2">
            {attendance.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-900">{r.first_name} {r.last_name}</span>
                <span className="text-sm text-gray-500">{r.join_clicked_at ? 'Joined' : '—'}</span>
                <select
                  value={r.status || 'absent'}
                  onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                  className="lms-form-select px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save attendance'}
          </button>
        </LmsCard>
      )}
      {selectedClass && attendance.length === 0 && (
        <p className="text-gray-500">No attendance records for this class yet. Students will appear after they click &quot;Join class&quot; or you can add them from the cohort roster.</p>
      )}
    </div>
  );
}
