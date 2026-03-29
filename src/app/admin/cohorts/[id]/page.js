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

const STATUS_CONFIG = {
  upcoming: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Upcoming' },
  active: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Active' },
  completed: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', label: 'Completed' },
};

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
    lower.includes('enrolled') ||
    lower.includes('resent') ||
    lower.includes('deleted')
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  );
}

const TABS = [
  { key: 'curriculum', label: 'Curriculum', icon: '📚' },
  { key: 'students', label: 'Students', icon: '👥' },
  { key: 'facilitators', label: 'Facilitators', icon: '🎓' },
  { key: 'enrollment', label: 'Enrollment', icon: '📋' },
];

export default function AdminCohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params?.id;
  const [activeTab, setActiveTab] = useState('curriculum');
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
  const [facilitatorForm, setFacilitatorForm] = useState({ email: '', firstName: '', lastName: '' });
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
    endTime: '',
    googleMeetLink: '',
  });
  const [editingLiveClassId, setEditingLiveClassId] = useState(null);
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
    if (!facilitatorForm.email?.trim()) return;
    setAssigningFacilitator(true);
    setFacilitatorMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/facilitators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          email: facilitatorForm.email.trim(),
          firstName: facilitatorForm.firstName.trim() || null,
          lastName: facilitatorForm.lastName.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.facilitators) {
        setFacilitators(data.facilitators);
        setFacilitatorMessage('Facilitator assigned.');
        setFacilitatorForm({ email: '', firstName: '', lastName: '' });
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

  const handleResendFacilitatorInvite = async (facilitatorId) => {
    setAssigningFacilitator(true);
    setFacilitatorMessage('');
    try {
      const res = await fetch(`/api/cohorts/${id}/facilitators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ facilitatorId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFacilitatorMessage('Invitation resent.');
      } else {
        setFacilitatorMessage(data.error || 'Resend failed');
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

  // Parse datetime-local value as WAT (UTC+1) and return UTC ISO string for TIMESTAMP column
  const toWatIso = (val) => {
    if (!val) return null;
    return new Date(`${val}:00+01:00`).toISOString();
  };

  // Convert stored UTC ISO string back to WAT datetime-local string for editing
  const toWatLocal = (isoStr) => {
    if (!isoStr) return '';
    const s = typeof isoStr === 'string' && !/Z|[+-]\d{2}:?\d{2}$/.test(isoStr) ? isoStr.replace(' ', 'T') + 'Z' : isoStr;
    const watMs = new Date(s).getTime() + 60 * 60 * 1000;
    return new Date(watMs).toISOString().slice(0, 16);
  };

  const handleEditLiveClass = (lc) => {
    setEditingLiveClassId(lc.id);
    setLiveClassForm({
      weekId: lc.week_id || '',
      scheduledAt: toWatLocal(lc.scheduled_at),
      endTime: toWatLocal(lc.end_time),
      googleMeetLink: lc.google_meet_link || '',
    });
    setLmsMessage('');
  };

  const handleCancelEditLiveClass = () => {
    setEditingLiveClassId(null);
    setLiveClassForm({ weekId: '', scheduledAt: '', endTime: '', googleMeetLink: '' });
    setLmsMessage('');
  };

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!liveClassForm.weekId || !liveClassForm.scheduledAt) return;
    setSavingLiveClass(true);
    setLmsMessage('');
    try {
      let res, data;
      if (editingLiveClassId) {
        res = await fetch(`/api/live-classes/${editingLiveClassId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            weekId: liveClassForm.weekId,
            scheduledAt: toWatIso(liveClassForm.scheduledAt),
            endTime: liveClassForm.endTime ? toWatIso(liveClassForm.endTime) : null,
            googleMeetLink: liveClassForm.googleMeetLink?.trim() || null,
          }),
        });
        data = await res.json();
        if (res.ok && data.liveClass) {
          await refreshLiveClasses();
          setEditingLiveClassId(null);
          setLiveClassForm({ weekId: '', scheduledAt: '', endTime: '', googleMeetLink: '' });
          setLmsMessage('Live class updated.');
        } else {
          setLmsMessage(data.error || 'Failed to update live class');
        }
      } else {
        res = await fetch(`/api/cohorts/${id}/live-classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            weekId: liveClassForm.weekId,
            scheduledAt: toWatIso(liveClassForm.scheduledAt),
            endTime: liveClassForm.endTime ? toWatIso(liveClassForm.endTime) : null,
            googleMeetLink: liveClassForm.googleMeetLink?.trim() || null,
          }),
        });
        data = await res.json();
        if (res.ok && data.liveClass) {
          await refreshLiveClasses();
          setLiveClassForm({ weekId: '', scheduledAt: '', endTime: '', googleMeetLink: '' });
          setLmsMessage('Live class scheduled.');
        } else {
          setLmsMessage(data.error || 'Failed to schedule live class');
        }
      }
    } catch {
      setLmsMessage(editingLiveClassId ? 'Failed to update live class' : 'Failed to schedule live class');
    } finally {
      setSavingLiveClass(false);
    }
  };

  const handleDeleteLiveClass = async (liveClassId) => {
    if (!confirm('Delete this scheduled class? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.deleted) {
        await refreshLiveClasses();
        setLmsMessage('Live class deleted.');
      } else {
        setLmsMessage(data.error || 'Failed to delete live class');
      }
    } catch {
      setLmsMessage('Failed to delete live class');
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
      <div className="admin-dashboard admin-dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--primary-100, #dbeafe)', borderTopColor: 'var(--primary-color, #0052a3)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-light)', fontSize: '0.9375rem' }}>Loading cohort...</p>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="admin-dashboard admin-dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-50, #eff6ff), var(--primary-100, #dbeafe))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>?</div>
        <p style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-color)' }}>Cohort not found</p>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9375rem' }}>This cohort may have been deleted or the link is incorrect.</p>
        <Link href="/admin/cohorts" className="admin-btn admin-btn-secondary" style={{ marginTop: '0.5rem' }}>Back to cohorts</Link>
      </div>
    );
  }

  // Compute progress for active cohorts
  const startDate = cohort.start_date ? new Date(cohort.start_date) : null;
  const endDate = cohort.end_date ? new Date(cohort.end_date) : null;
  const now = new Date();
  const totalDays = startDate && endDate ? Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;
  const elapsedDays = startDate ? Math.max(0, (now - startDate) / (1000 * 60 * 60 * 24)) : 0;
  const progressPct = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;
  const unlockedWeeks = weeks.filter((w) => !w.is_locked).length;

  return (
    <div className="admin-dashboard admin-dashboard-content admin-cohort-detail admin-cohort-detail-loaded">
      {/* Header */}
      <AdminPageHeader
        breadcrumb={<Link href="/admin/cohorts" style={{ color: 'var(--text-light)', fontSize: '0.875rem', textDecoration: 'none' }}>← Cohorts</Link>}
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

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Students', value: students.length, color: '#0052a3', icon: '👥' },
          { label: 'Facilitators', value: facilitators.length, color: '#7c3aed', icon: '🎓' },
          { label: 'Weeks', value: `${unlockedWeeks}/${weeks.length}`, color: '#059669', icon: '📅' },
          { label: 'Live classes', value: liveClasses.length, color: '#ea580c', icon: '📹' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '1.25rem',
              borderTop: `3px solid ${stat.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontWeight: 500 }}>{stat.label}</span>
              <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-color)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar for active cohorts */}
      {cohort.status === 'active' && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}>Cohort progress</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{progressPct}% complete</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: 4, background: 'linear-gradient(90deg, #0052a3, #3b82f6)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            <span>{formatDate(cohort.start_date)}</span>
            <span>Week {cohort.current_week || unlockedWeeks} of {weeks.length || 12}</span>
            <span>{formatDate(cohort.end_date)}</span>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        background: '#f3f4f6',
        borderRadius: 10,
        padding: '0.25rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: '1 1 0',
              padding: '0.625rem 1rem',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--primary-color, #0052a3)' : 'var(--text-light)',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
            {tab.label}
            {tab.key === 'students' && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({students.length})</span>}
            {tab.key === 'facilitators' && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({facilitators.length})</span>}
          </button>
        ))}
      </div>

      {/* Curriculum tab */}
      {activeTab === 'curriculum' && (
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
          handleDeleteLiveClass={handleDeleteLiveClass}
          handleEditLiveClass={handleEditLiveClass}
          handleCancelEditLiveClass={handleCancelEditLiveClass}
          editingLiveClassId={editingLiveClassId}
        />
      )}

      {/* Students tab */}
      {activeTab === 'students' && (
        <CohortStudentList students={students} formatDate={formatDate} />
      )}

      {/* Facilitators tab */}
      {activeTab === 'facilitators' && (
        <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>🎓</span>
            Facilitators
          </h2>
          <form onSubmit={handleAssignFacilitator} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', background: '#f9fafb', borderRadius: 8, marginBottom: '1.5rem' }}>
            <div className="admin-form-field" style={{ flex: '1 1 140px' }}>
              <label className="admin-form-label">First name</label>
              <input type="text" value={facilitatorForm.firstName} onChange={(e) => setFacilitatorForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
            </div>
            <div className="admin-form-field" style={{ flex: '1 1 140px' }}>
              <label className="admin-form-label">Last name</label>
              <input type="text" value={facilitatorForm.lastName} onChange={(e) => setFacilitatorForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
            </div>
            <div className="admin-form-field" style={{ flex: '2 1 200px' }}>
              <label className="admin-form-label">Email address</label>
              <input type="email" value={facilitatorForm.email} onChange={(e) => setFacilitatorForm((f) => ({ ...f, email: e.target.value }))} placeholder="facilitator@example.com" required />
            </div>
            <button type="submit" disabled={assigningFacilitator} className="admin-btn admin-btn-primary" style={{ flexShrink: 0 }}>{assigningFacilitator ? 'Assigning...' : 'Assign'}</button>
          </form>
          {isSuccessFeedback(facilitatorMessage) && <p style={{ marginBottom: '1rem', color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>{facilitatorMessage}</p>}

          {facilitators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '0.75rem' }}>🎓</div>
              <p style={{ fontSize: '0.9375rem' }}>No facilitators assigned yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {facilitators.map((f) => (
                <div key={f.id} style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                  }}>
                    {(f.first_name?.[0] || f.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>{f.first_name} {f.last_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{f.email}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Assigned {formatDate(f.assigned_at)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button type="button" onClick={() => handleResendFacilitatorInvite(f.id)} disabled={assigningFacilitator} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#0066cc' }}>Resend invite</button>
                    <button type="button" onClick={() => handleRemoveFacilitator(f.id)} disabled={assigningFacilitator} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrollment tab */}
      {activeTab === 'enrollment' && (
        <>
          <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>✉️</span>
              Enroll by email
            </h2>
            <form onSubmit={handleEnrollByEmail} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
              <div className="admin-form-field" style={{ flex: '1 1 280px' }}>
                <label className="admin-form-label">Student email</label>
                <input
                  type="email"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <button type="submit" disabled={enrolling} className="admin-btn admin-btn-primary" style={{ flexShrink: 0 }}>
                {enrolling ? 'Enrolling...' : 'Enroll'}
              </button>
            </form>
            {isSuccessFeedback(enrollMessage) && <p style={{ marginTop: '0.75rem', color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>{enrollMessage}</p>}
          </div>

          {applicationsNotEnrolled.length > 0 && (
            <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>📋</span>
                Applicants ({applicationsNotEnrolled.length})
              </h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.8125rem', marginBottom: '1rem' }}>Applicants for this track not yet enrolled. Click Enroll to add them.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {applicationsPaginated.map((app) => (
                  <div key={app.id} style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                    }}>
                      {(app.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>{app.first_name} {app.last_name}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>{app.email}</span>
                      {app.status && (
                        <span style={{
                          display: 'inline-block', fontSize: '0.6875rem', fontWeight: 600, marginLeft: '0.5rem',
                          padding: '2px 8px', borderRadius: 10,
                          background: app.status === 'paid' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: app.status === 'paid' ? '#059669' : '#6b7280',
                        }}>
                          {app.status}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEnrollFromApplication(app)}
                      disabled={enrolling}
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      Enroll
                    </button>
                  </div>
                ))}
              </div>
              {applicationsTotalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>
                    Showing {(applicationsPageSafe - 1) * APPLICATIONS_PAGE_SIZE + 1}–{Math.min(applicationsPageSafe * APPLICATIONS_PAGE_SIZE, applicationsNotEnrolled.length)} of {applicationsNotEnrolled.length}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setApplicationsPage((p) => Math.max(1, p - 1))} disabled={applicationsPageSafe <= 1} className="admin-btn admin-btn-ghost admin-btn-sm">Previous</button>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', minWidth: '5rem', textAlign: 'center' }}>Page {applicationsPageSafe} of {applicationsTotalPages}</span>
                    <button type="button" onClick={() => setApplicationsPage((p) => Math.min(applicationsTotalPages, p + 1))} disabled={applicationsPageSafe >= applicationsTotalPages} className="admin-btn admin-btn-ghost admin-btn-sm">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
