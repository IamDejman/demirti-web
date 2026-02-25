'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader } from '../../../components/admin';
import { useToast } from '../../../components/ToastProvider';

import { getAuthHeaders } from '@/lib/authClient';
import { formatDateLagos } from '@/lib/dateUtils';
import CohortStudentList from './CohortStudentList';
import CohortAssignments from './CohortAssignments';

const STATUS_COLORS = { upcoming: '#6b7280', active: '#059669', completed: '#2563eb' };

function isSuccessFeedback(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.includes('failed') || lower.includes('error') || lower.includes('wrong') || lower.includes('select ')) {
    return false;
  }
  return (
    lower.includes('success') ||
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('added') ||
    lower.includes('scheduled') ||
    lower.includes('assigned') ||
    lower.includes('removed') ||
    lower.includes('enrolled')
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 6,
        textTransform: 'capitalize',
        backgroundColor: `${color}20`,
        color,
      }}
    >
      {status}
    </span>
  );
}

export default function AdminCohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params?.id;
  const [cohort, setCohort] = useState(null);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [facilitators, setFacilitators] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [weekDetails, setWeekDetails] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollMessage, setEnrollMessage] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const APPLICATIONS_PAGE_SIZE = 10;
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [facilitatorEmail, setFacilitatorEmail] = useState('');
  const [facilitatorMessage, setFacilitatorMessage] = useState('');
  const [assigningFacilitator, setAssigningFacilitator] = useState(false);
  const [weekForm, setWeekForm] = useState({
    weekNumber: '',
    title: '',
    description: '',
    unlockDate: '',
    weekStartDate: '',
    weekEndDate: '',
    isLocked: true,
  });
  const [contentForm, setContentForm] = useState({
    type: 'document',
    title: '',
    description: '',
    fileUrl: '',
    externalUrl: '',
    orderIndex: 0,
    isDownloadable: false,
  });
  const [editingContentId, setEditingContentId] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    type: 'resource',
    title: '',
    description: '',
    url: '',
    fileUrl: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [liveClassForm, setLiveClassForm] = useState({
    weekId: '',
    scheduledAt: '',
    googleMeetLink: '',
  });
  const [lmsMessage, setLmsMessage] = useState('');
  const [savingWeek, setSavingWeek] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingLiveClass, setSavingLiveClass] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    weekId: '',
    title: '',
    description: '',
    deadlineAt: '',
    submissionType: 'text',
    maxScore: 100,
    isPublished: true,
  });
  const [savingAssignment, setSavingAssignment] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const [cohortRes, studentsRes, appsRes, facRes, weeksRes, liveRes] = await Promise.all([
          fetch(`/api/cohorts/${id}`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/students`, { headers: getAuthHeaders() }),
          fetch('/api/admin/applications', { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/facilitators`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/weeks`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/live-classes`, { headers: getAuthHeaders() }),
        ]);
        const cohortData = await cohortRes.json();
        const studentsData = await studentsRes.json();
        const appsData = await appsRes.json();
        const facData = await facRes.json();
        const weeksData = await weeksRes.json();
        const liveData = await liveRes.json();
        if (cohortRes.ok && cohortData.cohort) setCohort(cohortData.cohort);
        if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
        if (appsRes.ok && appsData.applications) setApplications(appsData.applications);
        if (facRes.ok && facData.facilitators) setFacilitators(facData.facilitators);
        if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
        if (liveRes.ok && liveData.liveClasses) setLiveClasses(liveData.liveClasses);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  useEffect(() => {
    if (!selectedWeekId) {
      setWeekDetails(null);
      setEditingContentId(null);
      setEditingMaterialId(null);
      return;
    }
    setAssignmentForm((f) => ({ ...f, weekId: selectedWeekId }));
    fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.week) {
          setWeekDetails(data);
        }
      });
    setEditingContentId(null);
    setEditingMaterialId(null);
  }, [selectedWeekId]);

  useEffect(() => {
    if (!enrollMessage || isSuccessFeedback(enrollMessage)) return;
    showToast({ type: 'error', message: enrollMessage });
  }, [enrollMessage, showToast]);

  useEffect(() => {
    if (!facilitatorMessage || isSuccessFeedback(facilitatorMessage)) return;
    showToast({ type: 'error', message: facilitatorMessage });
  }, [facilitatorMessage, showToast]);

  useEffect(() => {
    if (!lmsMessage || isSuccessFeedback(lmsMessage)) return;
    showToast({ type: 'error', message: lmsMessage });
  }, [lmsMessage, showToast]);

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
    } catch {
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
    } catch {
      setEnrollMessage('Something went wrong');
    } finally {
      setEnrolling(false);
    }
  };

  const handleAssignFacilitator = async (e) => {
    e.preventDefault();
    if (!facilitatorEmail?.trim()) return;
    setAssigningFacilitator(true);
    setFacilitatorMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/facilitators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: facilitatorEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.facilitators) {
        setFacilitators(data.facilitators);
        setFacilitatorMessage('Facilitator assigned.');
        setFacilitatorEmail('');
      } else {
        setFacilitatorMessage(data.error || 'Assign failed');
      }
    } catch {
      setFacilitatorMessage('Something went wrong');
    } finally {
      setAssigningFacilitator(false);
    }
  };

  const handleRemoveFacilitator = async (facilitatorId) => {
    setAssigningFacilitator(true);
    setFacilitatorMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/facilitators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ facilitatorId }),
      });
      const data = await res.json();
      if (res.ok && data.facilitators) {
        setFacilitators(data.facilitators);
        setFacilitatorMessage('Facilitator removed.');
      } else {
        setFacilitatorMessage(data.error || 'Remove failed');
      }
    } catch {
      setFacilitatorMessage('Something went wrong');
    } finally {
      setAssigningFacilitator(false);
    }
  };

  const refreshWeeks = async () => {
    const res = await fetch(`/api/cohorts/${id}/weeks`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.weeks) setWeeks(data.weeks);
  };

  const refreshLiveClasses = async () => {
    const res = await fetch(`/api/cohorts/${id}/live-classes`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.liveClasses) setLiveClasses(data.liveClasses);
  };

  const handleCreateWeek = async (e) => {
    e.preventDefault();
    if (!weekForm.weekNumber || !weekForm.title?.trim()) return;
    setSavingWeek(true);
    setLmsMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/weeks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          weekNumber: parseInt(weekForm.weekNumber, 10),
          title: weekForm.title.trim(),
          description: weekForm.description?.trim() || null,
          unlockDate: weekForm.unlockDate || null,
          weekStartDate: weekForm.weekStartDate || null,
          weekEndDate: weekForm.weekEndDate || null,
          isLocked: weekForm.isLocked,
        }),
      });
      const data = await res.json();
      if (res.ok && data.week) {
        await refreshWeeks();
        setWeekForm({
          weekNumber: '',
          title: '',
          description: '',
          unlockDate: '',
          weekStartDate: '',
          weekEndDate: '',
          isLocked: true,
        });
        setLmsMessage('Week created.');
      } else {
        setLmsMessage(data.error || 'Failed to create week');
      }
    } catch {
      setLmsMessage('Failed to create week');
    } finally {
      setSavingWeek(false);
    }
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    if (!selectedWeekId || !contentForm.title?.trim()) return;
    setSavingContent(true);
    setLmsMessage('');
    try {
      const endpoint = editingContentId ? `/api/content/${editingContentId}` : `/api/weeks/${selectedWeekId}/content`;
      const method = editingContentId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: contentForm.type,
          title: contentForm.title.trim(),
          description: contentForm.description?.trim() || null,
          fileUrl: contentForm.fileUrl?.trim() || null,
          externalUrl: contentForm.externalUrl?.trim() || null,
          orderIndex: Number(contentForm.orderIndex) || 0,
          isDownloadable: Boolean(contentForm.isDownloadable),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
        const weekData = await weekRes.json();
        if (weekData.week) setWeekDetails(weekData);
        setContentForm({ type: 'document', title: '', description: '', fileUrl: '', externalUrl: '', orderIndex: 0, isDownloadable: false });
        setEditingContentId(null);
        setLmsMessage(editingContentId ? 'Content item updated.' : 'Content item added.');
      } else {
        setLmsMessage(data.error || 'Failed to add content');
      }
    } catch {
      setLmsMessage('Failed to add content');
    } finally {
      setSavingContent(false);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!selectedWeekId || !materialForm.title?.trim()) return;
    setSavingMaterial(true);
    setLmsMessage('');
    try {
      const endpoint = editingMaterialId ? `/api/materials/${editingMaterialId}` : `/api/weeks/${selectedWeekId}/materials`;
      const method = editingMaterialId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: materialForm.type,
          title: materialForm.title.trim(),
          description: materialForm.description?.trim() || null,
          url: materialForm.url?.trim() || null,
          fileUrl: materialForm.fileUrl?.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
        const weekData = await weekRes.json();
        if (weekData.week) setWeekDetails(weekData);
        setMaterialForm({ type: 'resource', title: '', description: '', url: '', fileUrl: '' });
        setEditingMaterialId(null);
        setLmsMessage(editingMaterialId ? 'Material updated.' : 'Material added.');
      } else {
        setLmsMessage(data.error || 'Failed to add material');
      }
    } catch {
      setLmsMessage('Failed to add material');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleEditContent = (item) => {
    setEditingContentId(item.id);
    setContentForm({
      type: item.type || 'document',
      title: item.title || '',
      description: item.description || '',
      fileUrl: item.file_url || '',
      externalUrl: item.external_url || '',
      orderIndex: item.order_index ?? 0,
      isDownloadable: Boolean(item.is_downloadable),
    });
  };

  const handleDeleteContent = async (id) => {
    await fetch(`/api/content/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
    const weekData = await weekRes.json();
    if (weekData.week) setWeekDetails(weekData);
  };

  const handleEditMaterial = (item) => {
    setEditingMaterialId(item.id);
    setMaterialForm({
      type: item.type || 'resource',
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      fileUrl: item.file_url || '',
    });
  };

  const handleDeleteMaterial = async (id) => {
    await fetch(`/api/materials/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
    const weekData = await weekRes.json();
    if (weekData.week) setWeekDetails(weekData);
  };

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!liveClassForm.weekId || !liveClassForm.scheduledAt) return;
    setSavingLiveClass(true);
    setLmsMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/live-classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          weekId: liveClassForm.weekId,
          scheduledAt: liveClassForm.scheduledAt,
          googleMeetLink: liveClassForm.googleMeetLink?.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.liveClass) {
        await refreshLiveClasses();
        setLiveClassForm({ weekId: '', scheduledAt: '', googleMeetLink: '' });
        setLmsMessage('Live class scheduled.');
      } else {
        setLmsMessage(data.error || 'Failed to schedule live class');
      }
    } catch {
      setLmsMessage('Failed to schedule live class');
    } finally {
      setSavingLiveClass(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const weekId = assignmentForm.weekId || selectedWeekId;
    if (!weekId || !assignmentForm.title?.trim() || !assignmentForm.deadlineAt) {
      setLmsMessage('Select a week, enter title and deadline.');
      return;
    }
    setSavingAssignment(true);
    setLmsMessage('');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          weekId,
          cohortId: id,
          title: assignmentForm.title.trim(),
          description: assignmentForm.description?.trim() || null,
          deadlineAt: assignmentForm.deadlineAt,
          submissionType: assignmentForm.submissionType || 'text',
          maxScore: Number(assignmentForm.maxScore) || 100,
          isPublished: assignmentForm.isPublished ?? true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setAssignmentForm({
          weekId: '',
          title: '',
          description: '',
          deadlineAt: '',
          submissionType: 'text',
          maxScore: 100,
          isPublished: true,
        });
        setLmsMessage('Assignment created.');
      } else {
        setLmsMessage(data.error || 'Failed to create assignment');
      }
    } catch {
      setLmsMessage('Failed to create assignment');
    } finally {
      setSavingAssignment(false);
    }
  };

  const formatDate = (d) => (d ? formatDateLagos(d) : '');

  // Must be before any conditional return (rules of hooks)
  const enrolledEmails = new Set(students.map((s) => s.email));
  const applicationsNotEnrolled = cohort
    ? applications.filter((a) => {
        if (enrolledEmails.has(a.email)) return false;
        const sameTrack = !cohort.track_name || (a.track_name && String(a.track_name).toLowerCase() === String(cohort.track_name).toLowerCase());
        return sameTrack;
      })
    : [];
  const applicationsTotalPages = Math.max(1, Math.ceil(applicationsNotEnrolled.length / APPLICATIONS_PAGE_SIZE));
  const applicationsPageSafe = Math.min(applicationsPage, applicationsTotalPages);
  const applicationsPaginated = applicationsNotEnrolled.slice(
    (applicationsPageSafe - 1) * APPLICATIONS_PAGE_SIZE,
    applicationsPageSafe * APPLICATIONS_PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard-content admin-cohort-detail admin-cohort-loading">
        <div className="admin-cohort-loading-spinner" />
        <p className="admin-loading">Loading cohort...</p>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="admin-dashboard admin-dashboard-content admin-cohort-detail admin-cohort-empty">
        <div className="admin-cohort-empty-card">
          <p className="admin-cohort-empty-title">Cohort not found</p>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>This cohort may have been deleted or the link is incorrect.</p>
          <Link href="/admin/cohorts" className="admin-btn admin-btn-secondary">← Back to cohorts</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-dashboard-content admin-cohort-detail admin-cohort-detail-loaded">
        <AdminPageHeader
          breadcrumb={<Link href="/admin/cohorts" style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>← Cohorts</Link>}
          title={cohort.name}
          description={
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--text-light)' }}>{cohort.track_name}</span>
              <span style={{ color: '#9ca3af' }}>·</span>
              <span style={{ color: 'var(--text-light)' }}>{formatDate(cohort.start_date)} – {formatDate(cohort.end_date)}</span>
              <StatusBadge status={cohort.status} />
            </span>
          }
          actions={
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Delete cohort "${cohort.name}"? This cannot be undone.`)) return;
                try {
                  const res = await fetch(`/api/cohorts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                  const data = await res.json();
                  if (res.ok && data.deleted) {
                    router.push('/admin/cohorts');
                  } else {
                    showToast({ type: 'error', message: data.error || 'Failed to delete cohort' });
                  }
                } catch {
                  showToast({ type: 'error', message: 'Failed to delete cohort' });
                }
              }}
              className="admin-btn admin-btn-danger admin-btn-sm"
            >
              Delete cohort
            </button>
          }
        />

        <div className="admin-card">
          <h2 className="admin-card-title">Enroll student</h2>
          <form onSubmit={handleEnrollByEmail} className="admin-form-group admin-action-group admin-cohort-enroll-form">
            <div className="admin-form-group admin-cohort-enroll-input">
              <label className="admin-form-label">Email</label>
              <div className="admin-form-field">
                <input
                  type="email"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
            </div>
            <button type="submit" disabled={enrolling} className="admin-btn admin-btn-primary">
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </button>
          </form>
          {isSuccessFeedback(enrollMessage) && <p className="admin-form-hint" style={{ marginTop: '0.5rem', color: '#059669' }}>{enrollMessage}</p>}
        </div>

        {applicationsNotEnrolled.length > 0 && (
          <div className="admin-card">
            <h2 className="admin-card-title">Enroll from applications</h2>
            <p className="admin-form-hint" style={{ marginBottom: '1rem' }}>Applicants for this track not yet in this cohort (paid or unpaid). Click Enroll to add them as a student user and enroll in the cohort:</p>
            <ul className="admin-cohort-app-list">
              {applicationsPaginated.map((app) => (
                <li key={app.id} className="admin-cohort-app-card">
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{app.first_name} {app.last_name}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>{app.email}</span>
                    {app.track_name && <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{app.track_name}</span>}
                    {app.status && (
                      <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, marginTop: 4, padding: '2px 6px', borderRadius: 4, background: app.status === 'paid' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(107, 114, 128, 0.2)', color: app.status === 'paid' ? '#059669' : '#6b7280' }}>
                        {app.status}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEnrollFromApplication(app)}
                    disabled={enrolling}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                  >
                    Enroll
                  </button>
                </li>
              ))}
            </ul>
            {applicationsTotalPages > 1 && (
              <div className="admin-cohort-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                <span className="admin-form-hint" style={{ margin: 0 }}>
                  Showing {(applicationsPageSafe - 1) * APPLICATIONS_PAGE_SIZE + 1}–{Math.min(applicationsPageSafe * APPLICATIONS_PAGE_SIZE, applicationsNotEnrolled.length)} of {applicationsNotEnrolled.length}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setApplicationsPage((p) => Math.max(1, p - 1))}
                    disabled={applicationsPageSafe <= 1}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    Previous
                  </button>
                  <span className="admin-form-hint" style={{ margin: 0, minWidth: '5rem', textAlign: 'center' }}>
                    Page {applicationsPageSafe} of {applicationsTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setApplicationsPage((p) => Math.min(applicationsTotalPages, p + 1))}
                    disabled={applicationsPageSafe >= applicationsTotalPages}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <CohortAssignments
          weeks={weeks}
          selectedWeekId={selectedWeekId}
          setSelectedWeekId={setSelectedWeekId}
          weekDetails={weekDetails}
          weekForm={weekForm}
          setWeekForm={setWeekForm}
          contentForm={contentForm}
          setContentForm={setContentForm}
          editingContentId={editingContentId}
          setEditingContentId={setEditingContentId}
          materialForm={materialForm}
          setMaterialForm={setMaterialForm}
          editingMaterialId={editingMaterialId}
          setEditingMaterialId={setEditingMaterialId}
          liveClassForm={liveClassForm}
          setLiveClassForm={setLiveClassForm}
          liveClasses={liveClasses}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          savingAssignment={savingAssignment}
          handleCreateAssignment={handleCreateAssignment}
          lmsMessage={lmsMessage}
          savingWeek={savingWeek}
          savingContent={savingContent}
          savingMaterial={savingMaterial}
          savingLiveClass={savingLiveClass}
          handleCreateWeek={handleCreateWeek}
          handleCreateContent={handleCreateContent}
          handleCreateMaterial={handleCreateMaterial}
          handleEditContent={handleEditContent}
          handleDeleteContent={handleDeleteContent}
          handleEditMaterial={handleEditMaterial}
          handleDeleteMaterial={handleDeleteMaterial}
          handleCreateLiveClass={handleCreateLiveClass}
        />

        <div className="admin-card">
          <h2 className="admin-card-title">Facilitators</h2>
          <form onSubmit={handleAssignFacilitator} className="admin-form-group admin-action-group admin-cohort-enroll-form">
            <div className="admin-form-group admin-cohort-enroll-input">
              <label className="admin-form-label">Facilitator email</label>
              <div className="admin-form-field">
                <input type="email" value={facilitatorEmail} onChange={(e) => setFacilitatorEmail(e.target.value)} placeholder="facilitator@example.com" />
              </div>
            </div>
            <button type="submit" disabled={assigningFacilitator} className="admin-btn admin-btn-primary">{assigningFacilitator ? 'Assigning...' : 'Assign'}</button>
          </form>
          {isSuccessFeedback(facilitatorMessage) && <p className="admin-form-hint" style={{ marginTop: '0.5rem', color: '#059669' }}>{facilitatorMessage}</p>}

          {facilitators.length === 0 ? (
            <p className="admin-form-hint" style={{ marginTop: '1rem' }}>No facilitators assigned yet.</p>
          ) : (
            <div className="admin-cohort-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-table-th">Name</th>
                    <th className="admin-table-th">Email</th>
                    <th className="admin-table-th">Assigned</th>
                    <th className="admin-table-th">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facilitators.map((f) => (
                    <tr key={f.id} className="admin-table-tr">
                      <td className="admin-table-td" style={{ fontWeight: 500 }}>{f.first_name} {f.last_name}</td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{f.email}</td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{formatDate(f.assigned_at)}</td>
                      <td className="admin-table-td">
                        <button type="button" onClick={() => handleRemoveFacilitator(f.id)} disabled={assigningFacilitator} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <CohortStudentList students={students} formatDate={formatDate} />
      </div>
  );
}
