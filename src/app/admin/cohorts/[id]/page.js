'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader, Modal } from '../../../components/admin';
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
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'students', label: 'Students' },
  { key: 'facilitators', label: 'Facilitators' },
  { key: 'enrollment', label: 'Enrollment' },
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
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [liveClassModalOpen, setLiveClassModalOpen] = useState(false);
  // Edit cohort
  const [cohortEditModalOpen, setCohortEditModalOpen] = useState(false);
  const [cohortEditForm, setCohortEditForm] = useState({ name: '', startDate: '', endDate: '', status: '', currentWeek: '' });
  const [savingCohort, setSavingCohort] = useState(false);
  // Edit week
  const [weekEditModalOpen, setWeekEditModalOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [weekEditForm, setWeekEditForm] = useState({ title: '', description: '', weekStartDate: '', weekEndDate: '', unlockDate: '', isLocked: true });
  const [savingWeekEdit, setSavingWeekEdit] = useState(false);
  // Assignments list + edit
  const [assignments, setAssignments] = useState([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [assignmentEditForm, setAssignmentEditForm] = useState({ title: '', description: '', deadlineAt: '', maxScore: 100, isPublished: true });
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [savingAssignmentEdit, setSavingAssignmentEdit] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const [cohortRes, studentsRes, appsRes, facRes, weeksRes, liveRes, assignmentsRes] = await Promise.all([
          fetch(`/api/cohorts/${id}`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/students`, { headers: getAuthHeaders() }),
          fetch('/api/admin/applications', { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/facilitators`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/weeks`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/live-classes`, { headers: getAuthHeaders() }),
          fetch(`/api/cohorts/${id}/assignments`, { headers: getAuthHeaders() }),
        ]);
        const cohortData = await cohortRes.json();
        const studentsData = await studentsRes.json();
        const appsData = await appsRes.json();
        const facData = await facRes.json();
        const weeksData = await weeksRes.json();
        const liveData = await liveRes.json();
        const assignmentsData = await assignmentsRes.json();
        if (cohortRes.ok && cohortData.cohort) setCohort(cohortData.cohort);
        if (studentsRes.ok && studentsData.students) setStudents(studentsData.students);
        if (appsRes.ok && appsData.applications) setApplications(appsData.applications);
        if (facRes.ok && facData.facilitators) setFacilitators(facData.facilitators);
        if (weeksRes.ok && weeksData.weeks) setWeeks(weeksData.weeks);
        if (liveRes.ok && liveData.liveClasses) setLiveClasses(liveData.liveClasses);
        if (assignmentsRes.ok && assignmentsData.assignments) setAssignments(assignmentsData.assignments);
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
        setContentModalOpen(false);
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
        setMaterialModalOpen(false);
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
    setContentModalOpen(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Delete this content item? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/content/${contentId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { showToast({ type: 'error', message: 'Failed to delete content item' }); return; }
      const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
      const weekData = await weekRes.json();
      if (weekData.week) setWeekDetails(weekData);
    } catch {
      showToast({ type: 'error', message: 'Failed to delete content item' });
    }
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
    setMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Delete this material? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/materials/${materialId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { showToast({ type: 'error', message: 'Failed to delete material' }); return; }
      const weekRes = await fetch(`/api/weeks/${selectedWeekId}`, { headers: getAuthHeaders() });
      const weekData = await weekRes.json();
      if (weekData.week) setWeekDetails(weekData);
    } catch {
      showToast({ type: 'error', message: 'Failed to delete material' });
    }
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
    setLiveClassModalOpen(true);
  };

  const handleCancelEditLiveClass = () => {
    setEditingLiveClassId(null);
    setLiveClassForm({ weekId: '', scheduledAt: '', endTime: '', googleMeetLink: '' });
    setLiveClassModalOpen(false);
    setLmsMessage('');
  };

  const handleOpenEditCohort = () => {
    setCohortEditForm({
      name: cohort.name || '',
      startDate: cohort.start_date ? cohort.start_date.slice(0, 10) : '',
      endDate: cohort.end_date ? cohort.end_date.slice(0, 10) : '',
      status: cohort.status || 'upcoming',
      currentWeek: cohort.current_week ?? '',
    });
    setCohortEditModalOpen(true);
  };

  const handleUpdateCohort = async (e) => {
    e.preventDefault();
    setSavingCohort(true);
    try {
      const res = await fetch(`/api/cohorts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: cohortEditForm.name.trim(),
          startDate: cohortEditForm.startDate || null,
          endDate: cohortEditForm.endDate || null,
          status: cohortEditForm.status,
          currentWeek: cohortEditForm.currentWeek !== '' ? Number(cohortEditForm.currentWeek) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.cohort) {
        setCohort(data.cohort);
        setCohortEditModalOpen(false);
        showToast({ type: 'success', message: 'Cohort updated.' });
      } else {
        showToast({ type: 'error', message: data.error || 'Failed to update cohort' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to update cohort' });
    } finally {
      setSavingCohort(false);
    }
  };

  const handleOpenEditWeek = (week) => {
    setEditingWeekId(week.id);
    setWeekEditForm({
      title: week.title || '',
      description: week.description || '',
      weekStartDate: week.week_start_date ? week.week_start_date.slice(0, 10) : '',
      weekEndDate: week.week_end_date ? week.week_end_date.slice(0, 10) : '',
      unlockDate: week.unlock_date ? week.unlock_date.slice(0, 16) : '',
      isLocked: Boolean(week.is_locked),
    });
    setWeekEditModalOpen(true);
  };

  const handleUpdateWeek = async (e) => {
    e.preventDefault();
    if (!editingWeekId || !weekEditForm.title?.trim()) return;
    setSavingWeekEdit(true);
    try {
      const res = await fetch(`/api/weeks/${editingWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: weekEditForm.title.trim(),
          description: weekEditForm.description?.trim() || null,
          weekStartDate: weekEditForm.weekStartDate || null,
          weekEndDate: weekEditForm.weekEndDate || null,
          unlockDate: weekEditForm.unlockDate || null,
          isLocked: weekEditForm.isLocked,
        }),
      });
      const data = await res.json();
      if (res.ok && data.week) {
        setWeeks((prev) => prev.map((w) => w.id === editingWeekId ? { ...w, ...data.week } : w));
        setWeekEditModalOpen(false);
        setEditingWeekId(null);
        showToast({ type: 'success', message: 'Week updated.' });
      } else {
        showToast({ type: 'error', message: data.error || 'Failed to update week' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to update week' });
    } finally {
      setSavingWeekEdit(false);
    }
  };

  const handleOpenEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setAssignmentEditForm({
      title: assignment.title || '',
      description: assignment.description || '',
      deadlineAt: assignment.deadline_at ? assignment.deadline_at.slice(0, 16) : '',
      maxScore: assignment.max_score ?? 100,
      isPublished: Boolean(assignment.is_published),
    });
    setAssignmentModalOpen(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!editingAssignmentId || !assignmentEditForm.title?.trim()) return;
    setSavingAssignmentEdit(true);
    try {
      const res = await fetch(`/api/assignments/${editingAssignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: assignmentEditForm.title.trim(),
          description: assignmentEditForm.description?.trim() || null,
          deadlineAt: assignmentEditForm.deadlineAt || null,
          maxScore: Number(assignmentEditForm.maxScore) || 100,
          isPublished: assignmentEditForm.isPublished,
        }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setAssignments((prev) => prev.map((a) => a.id === editingAssignmentId ? data.assignment : a));
        setAssignmentModalOpen(false);
        setEditingAssignmentId(null);
        showToast({ type: 'success', message: 'Assignment updated.' });
      } else {
        showToast({ type: 'error', message: data.error || 'Failed to update assignment' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to update assignment' });
    } finally {
      setSavingAssignmentEdit(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.deleted) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
        showToast({ type: 'success', message: 'Assignment deleted.' });
      } else {
        showToast({ type: 'error', message: data.error || 'Failed to delete assignment' });
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to delete assignment' });
    }
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
          setLiveClassModalOpen(false);
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
        setAssignments((prev) => [...prev, data.assignment]);
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
      {/* Back nav — outside the header card */}
      <nav style={{ marginBottom: '0.75rem' }}>
        <Link
          href="/admin/cohorts"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Cohorts
        </Link>
      </nav>

      {/* Header */}
      <AdminPageHeader
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleOpenEditCohort}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            Edit cohort
          </button>
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
          </div>
        }
      />

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Students', value: students.length, color: '#0052a3' },
          { label: 'Facilitators', value: facilitators.length, color: '#7c3aed' },
          { label: 'Weeks', value: `${unlockedWeeks}/${weeks.length}`, color: '#059669' },
          { label: 'Live classes', value: liveClasses.length, color: '#ea580c' },
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
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontWeight: 500 }}>{stat.label}</span>
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
          materialForm={materialForm}
          setMaterialForm={setMaterialForm}
          liveClassForm={liveClassForm}
          setLiveClassForm={setLiveClassForm}
          liveClasses={liveClasses}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          savingAssignment={savingAssignment}
          handleCreateAssignment={handleCreateAssignment}
          assignments={assignments}
          handleOpenEditAssignment={handleOpenEditAssignment}
          handleDeleteAssignment={handleDeleteAssignment}
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
          handleOpenEditWeek={handleOpenEditWeek}
        />
      )}

      {/* Students tab */}
      {activeTab === 'students' && (
        <CohortStudentList students={students} formatDate={formatDate} />
      )}

      {/* Facilitators tab */}
      {activeTab === 'facilitators' && (
        <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="admin-card-title">Facilitators</h2>
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
            <h2 className="admin-card-title">Enroll by email</h2>
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
              <h2 className="admin-card-title">Applicants ({applicationsNotEnrolled.length})</h2>
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

      {/* Edit content modal */}
      {contentModalOpen && (
        <Modal
          title="Edit content item"
          onClose={() => {
            setContentModalOpen(false);
            setEditingContentId(null);
            setContentForm({ type: 'document', title: '', description: '', fileUrl: '', externalUrl: '', orderIndex: 0, isDownloadable: false });
          }}
        >
          <form onSubmit={handleCreateContent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Type</label>
              <select value={contentForm.type} onChange={(e) => setContentForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="video_embed">Video</option>
                <option value="document">Document</option>
                <option value="link">Link</option>
                <option value="recording">Recording</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Title</label>
              <input type="text" value={contentForm.title} onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Description</label>
              <textarea value={contentForm.description} onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">File URL</label>
              <input type="text" value={contentForm.fileUrl} onChange={(e) => setContentForm((f) => ({ ...f, fileUrl: e.target.value }))} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">External URL</label>
              <input type="text" value={contentForm.externalUrl} onChange={(e) => setContentForm((f) => ({ ...f, externalUrl: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Order</label>
                <input type="number" value={contentForm.orderIndex} onChange={(e) => setContentForm((f) => ({ ...f, orderIndex: e.target.value }))} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap', marginTop: '1.25rem' }}>
                <input type="checkbox" checked={contentForm.isDownloadable} onChange={(e) => setContentForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                Downloadable
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => {
                setContentModalOpen(false);
                setEditingContentId(null);
                setContentForm({ type: 'document', title: '', description: '', fileUrl: '', externalUrl: '', orderIndex: 0, isDownloadable: false });
              }}>Cancel</button>
              <button type="submit" disabled={savingContent} className="admin-btn admin-btn-primary">{savingContent ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit material modal */}
      {materialModalOpen && (
        <Modal
          title="Edit material"
          onClose={() => {
            setMaterialModalOpen(false);
            setEditingMaterialId(null);
            setMaterialForm({ type: 'resource', title: '', description: '', url: '', fileUrl: '' });
          }}
        >
          <form onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Type</label>
              <select value={materialForm.type} onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="book">Book</option>
                <option value="software">Software</option>
                <option value="starter_file">Starter file</option>
                <option value="resource">Resource</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Title</label>
              <input type="text" value={materialForm.title} onChange={(e) => setMaterialForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Description</label>
              <textarea value={materialForm.description} onChange={(e) => setMaterialForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">URL</label>
              <input type="text" value={materialForm.url} onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">File URL</label>
              <input type="text" value={materialForm.fileUrl} onChange={(e) => setMaterialForm((f) => ({ ...f, fileUrl: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => {
                setMaterialModalOpen(false);
                setEditingMaterialId(null);
                setMaterialForm({ type: 'resource', title: '', description: '', url: '', fileUrl: '' });
              }}>Cancel</button>
              <button type="submit" disabled={savingMaterial} className="admin-btn admin-btn-primary">{savingMaterial ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit live class modal */}
      {liveClassModalOpen && (
        <Modal
          title="Edit live class"
          onClose={handleCancelEditLiveClass}
        >
          <form onSubmit={handleCreateLiveClass} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Week</label>
              <select value={liveClassForm.weekId} onChange={(e) => setLiveClassForm((f) => ({ ...f, weekId: e.target.value }))}>
                <option value="">Select week</option>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Start time (WAT)</label>
              <input type="datetime-local" value={liveClassForm.scheduledAt} onChange={(e) => setLiveClassForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">End time (WAT)</label>
              <input type="datetime-local" value={liveClassForm.endTime} onChange={(e) => setLiveClassForm((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Google Meet link</label>
              <input type="text" placeholder="https://meet.google.com/..." value={liveClassForm.googleMeetLink} onChange={(e) => setLiveClassForm((f) => ({ ...f, googleMeetLink: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={handleCancelEditLiveClass}>Cancel</button>
              <button type="submit" disabled={savingLiveClass} className="admin-btn admin-btn-primary">{savingLiveClass ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit cohort modal */}
      {cohortEditModalOpen && (
        <Modal title="Edit cohort" onClose={() => setCohortEditModalOpen(false)}>
          <form onSubmit={handleUpdateCohort} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Name</label>
              <input type="text" value={cohortEditForm.name} onChange={(e) => setCohortEditForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Start date</label>
                <input type="date" value={cohortEditForm.startDate} onChange={(e) => setCohortEditForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">End date</label>
                <input type="date" value={cohortEditForm.endDate} onChange={(e) => setCohortEditForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Status</label>
                <select value={cohortEditForm.status} onChange={(e) => setCohortEditForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Current week</label>
                <input type="number" min={0} value={cohortEditForm.currentWeek} onChange={(e) => setCohortEditForm((f) => ({ ...f, currentWeek: e.target.value }))} placeholder="e.g. 3" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCohortEditModalOpen(false)}>Cancel</button>
              <button type="submit" disabled={savingCohort} className="admin-btn admin-btn-primary">{savingCohort ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit week modal */}
      {weekEditModalOpen && (
        <Modal title="Edit week" onClose={() => { setWeekEditModalOpen(false); setEditingWeekId(null); }}>
          <form onSubmit={handleUpdateWeek} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Title</label>
              <input type="text" value={weekEditForm.title} onChange={(e) => setWeekEditForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Description</label>
              <textarea value={weekEditForm.description} onChange={(e) => setWeekEditForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Start date</label>
                <input type="date" value={weekEditForm.weekStartDate} onChange={(e) => setWeekEditForm((f) => ({ ...f, weekStartDate: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">End date</label>
                <input type="date" value={weekEditForm.weekEndDate} onChange={(e) => setWeekEditForm((f) => ({ ...f, weekEndDate: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Unlock date</label>
              <input type="datetime-local" value={weekEditForm.unlockDate} onChange={(e) => setWeekEditForm((f) => ({ ...f, unlockDate: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={!weekEditForm.isLocked} onChange={(e) => setWeekEditForm((f) => ({ ...f, isLocked: !e.target.checked }))} />
              Unlocked (visible to students)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setWeekEditModalOpen(false); setEditingWeekId(null); }}>Cancel</button>
              <button type="submit" disabled={savingWeekEdit} className="admin-btn admin-btn-primary">{savingWeekEdit ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit assignment modal */}
      {assignmentModalOpen && (
        <Modal title="Edit assignment" onClose={() => { setAssignmentModalOpen(false); setEditingAssignmentId(null); }}>
          <form onSubmit={handleUpdateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Title</label>
              <input type="text" value={assignmentEditForm.title} onChange={(e) => setAssignmentEditForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Description</label>
              <textarea value={assignmentEditForm.description} onChange={(e) => setAssignmentEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Deadline</label>
                <input type="datetime-local" value={assignmentEditForm.deadlineAt} onChange={(e) => setAssignmentEditForm((f) => ({ ...f, deadlineAt: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Max score</label>
                <input type="number" min={0} value={assignmentEditForm.maxScore} onChange={(e) => setAssignmentEditForm((f) => ({ ...f, maxScore: e.target.value }))} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={assignmentEditForm.isPublished} onChange={(e) => setAssignmentEditForm((f) => ({ ...f, isPublished: e.target.checked }))} />
              Published (visible to students)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setAssignmentModalOpen(false); setEditingAssignmentId(null); }}>Cancel</button>
              <button type="submit" disabled={savingAssignmentEdit} className="admin-btn admin-btn-primary">{savingAssignmentEdit ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
