'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

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
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Attendance" subtitle="Mark attendance for live classes." icon={LmsIcons.users} />
      <LmsCard title="Select cohort">
        <label className="lms-form-label block">Cohort</label>
        <select
          value={selectedCohort || ''}
          onChange={(e) => { setSelectedCohort(e.target.value || null); setSelectedClass(null); }}
          className="lms-input mt-1 block w-full sm:max-w-md"
        >
          <option value="">Select cohort</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </LmsCard>
      {liveClasses.length > 0 && (
        <LmsCard title="Select live class">
          <label className="lms-form-label block">Live class</label>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value || null)}
            className="lms-input mt-1 block w-full sm:max-w-md"
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
          <div className="lms-table-wrapper">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Join status</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium" style={{ color: 'var(--neutral-900)' }}>{r.first_name} {r.last_name}</td>
                    <td>
                      {r.join_clicked_at ? (
                        <span className="lms-badge lms-badge-success">Joined</span>
                      ) : (
                        <span className="lms-badge lms-badge-neutral">Not joined</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={r.status || 'absent'}
                        onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                        className="lms-input text-sm"
                        style={{
                          borderColor: r.status === 'present' ? '#16a34a' : r.status === 'excused' ? '#d97706' : 'var(--neutral-300)',
                          color: r.status === 'present' ? '#16a34a' : r.status === 'excused' ? '#d97706' : r.status === 'absent' ? '#dc2626' : 'var(--neutral-700)',
                          backgroundColor: r.status === 'present' ? 'rgba(22, 163, 74, 0.05)' : r.status === 'excused' ? 'rgba(217, 119, 6, 0.05)' : r.status === 'absent' ? 'rgba(220, 38, 38, 0.05)' : 'white',
                        }}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="lms-btn lms-btn-primary"
            >
              {saving ? 'Saving...' : 'Save attendance'}
            </button>
          </div>
        </LmsCard>
      )}
      {selectedClass && attendance.length === 0 && (
        <p style={{ color: 'var(--neutral-500)' }}>No attendance records for this class yet. Students will appear after they click &quot;Join class&quot; or you can add them from the cohort roster.</p>
      )}
    </div>
  );
}
