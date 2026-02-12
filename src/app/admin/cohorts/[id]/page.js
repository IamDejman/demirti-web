'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageHeader } from '../../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos, formatDateLagos } from '@/lib/dateUtils';

export default function AdminCohortDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const [facilitatorEmail, setFacilitatorEmail] = useState('');
  const [facilitatorMessage, setFacilitatorMessage] = useState('');
  const [assigningFacilitator, setAssigningFacilitator] = useState(false);
  const [weekForm, setWeekForm] = useState({
    weekNumber: '',
    title: '',
    description: '',
    unlockDate: '',
    liveClassDatetime: '',
    googleMeetLink: '',
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
          fetch('/api/admin/applications?status=paid', { headers: getAuthHeaders() }),
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
          liveClassDatetime: weekForm.liveClassDatetime || null,
          googleMeetLink: weekForm.googleMeetLink?.trim() || null,
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
          liveClassDatetime: '',
          googleMeetLink: '',
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

  const formatDate = (d) => (d ? formatDateLagos(d) : '');

  const statusColors = { upcoming: '#6b7280', active: '#059669', completed: '#2563eb' };
  const StatusBadge = ({ status }) => (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 6,
        textTransform: 'capitalize',
        backgroundColor: `${statusColors[status] || '#6b7280'}20`,
        color: statusColors[status] || '#6b7280',
      }}
    >
      {status}
    </span>
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

  const enrolledEmails = new Set(students.map((s) => s.email));
  const sameTrack = (a) => !cohort?.track_name || (a.track_name && String(a.track_name).toLowerCase() === String(cohort.track_name).toLowerCase());
  const paidNotEnrolled = applications.filter((a) => a.status === 'paid' && !enrolledEmails.has(a.email) && sameTrack(a));

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
                    alert(data.error || 'Failed to delete cohort');
                  }
                } catch {
                  alert('Failed to delete cohort');
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
          {enrollMessage && <p className="admin-form-hint" style={{ marginTop: '0.5rem', color: enrollMessage.includes('success') ? '#059669' : 'inherit' }}>{enrollMessage}</p>}
        </div>

        {paidNotEnrolled.length > 0 && (
          <div className="admin-card">
            <h2 className="admin-card-title">Enroll from paid applications</h2>
            <p className="admin-form-hint" style={{ marginBottom: '1rem' }}>Paid applicants for this track not yet in this cohort. Click Enroll to add them as a student user and enroll in the cohort:</p>
            <ul className="admin-cohort-app-list">
              {paidNotEnrolled.slice(0, 20).map((app) => (
                <li key={app.id} className="admin-cohort-app-card">
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{app.first_name} {app.last_name}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>{app.email}</span>
                    {app.track_name && <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{app.track_name}</span>}
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
            {paidNotEnrolled.length > 20 && <p className="admin-form-hint" style={{ marginTop: '1rem' }}>Showing first 20. Use email field above for others.</p>}
          </div>
        )}

        <div className="admin-card">
          <h2 className="admin-card-title">Weeks and content</h2>
          {lmsMessage && <p className="admin-form-hint" style={{ marginBottom: '1rem', color: lmsMessage.includes('created') || lmsMessage.includes('added') || lmsMessage.includes('updated') ? '#059669' : 'inherit' }}>{lmsMessage}</p>}

          <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="admin-cohort-section-card">
              <h3 className="admin-card-title">Create week</h3>
              <form onSubmit={handleCreateWeek} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="admin-form-field">
                  <input type="number" placeholder="Week number" value={weekForm.weekNumber} onChange={(e) => setWeekForm((f) => ({ ...f, weekNumber: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <input type="text" placeholder="Week title" value={weekForm.title} onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <textarea placeholder="Description (optional)" value={weekForm.description} onChange={(e) => setWeekForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="admin-form-field">
                  <input type="datetime-local" value={weekForm.unlockDate} onChange={(e) => setWeekForm((f) => ({ ...f, unlockDate: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <input type="datetime-local" value={weekForm.liveClassDatetime} onChange={(e) => setWeekForm((f) => ({ ...f, liveClassDatetime: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <input type="text" placeholder="Google Meet link (optional)" value={weekForm.googleMeetLink} onChange={(e) => setWeekForm((f) => ({ ...f, googleMeetLink: e.target.value }))} />
                </div>
                <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!weekForm.isLocked} onChange={(e) => setWeekForm((f) => ({ ...f, isLocked: !e.target.checked }))} />
                  Unlock immediately
                </label>
                <button type="submit" disabled={savingWeek} className="admin-btn admin-btn-primary">{savingWeek ? 'Saving...' : 'Create week'}</button>
              </form>
            </div>

            <div className="admin-cohort-section-card">
              <h3 className="admin-card-title">Select week</h3>
              <div className="admin-form-field">
                <select
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                >
                <option value="">Select a week</option>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    Week {w.week_number} · {w.title}
                  </option>
                ))}
              </select>
              </div>

              {weekDetails && (
                <div className="admin-form-hint" style={{ marginTop: '1rem' }}>
                  <p><strong>Title:</strong> {weekDetails.week.title}</p>
                  <p><strong>Unlock:</strong> {weekDetails.week.unlock_date ? formatTimeLagos(weekDetails.week.unlock_date) : '—'}</p>
                </div>
              )}
            </div>
          </div>

          {selectedWeekId && (
            <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              <div className="admin-cohort-section-card">
                <h3 className="admin-card-title">Add content item</h3>
                <form onSubmit={handleCreateContent} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="admin-form-field">
                    <select value={contentForm.type} onChange={(e) => setContentForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="pdf">PDF</option>
                    <option value="slides">Slides</option>
                    <option value="video_embed">Video</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="recording">Recording</option>
                  </select>
                  </div>
                  <div className="admin-form-field"><input type="text" placeholder="Title" value={contentForm.title} onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))} /></div>
                  <div className="admin-form-field"><textarea placeholder="Description (optional)" value={contentForm.description} onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div className="admin-form-field"><input type="text" placeholder="File URL (optional)" value={contentForm.fileUrl} onChange={(e) => setContentForm((f) => ({ ...f, fileUrl: e.target.value }))} /></div>
                  <div className="admin-form-field"><input type="text" placeholder="External URL (optional)" value={contentForm.externalUrl} onChange={(e) => setContentForm((f) => ({ ...f, externalUrl: e.target.value }))} /></div>
                  <div className="admin-form-field"><input type="number" placeholder="Order index" value={contentForm.orderIndex} onChange={(e) => setContentForm((f) => ({ ...f, orderIndex: e.target.value }))} /></div>
                  <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={contentForm.isDownloadable} onChange={(e) => setContentForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                    Downloadable
                  </label>
                  <button type="submit" disabled={savingContent} className="admin-btn admin-btn-primary">{savingContent ? 'Saving...' : editingContentId ? 'Update content' : 'Add content'}</button>
                </form>
              </div>

              <div className="admin-cohort-section-card">
                <h3 className="admin-card-title">Add material</h3>
                <form onSubmit={handleCreateMaterial} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="admin-form-field">
                    <select value={materialForm.type} onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="book">Book</option>
                    <option value="software">Software</option>
                    <option value="starter_file">Starter file</option>
                    <option value="resource">Resource</option>
                  </select>
                  </div>
                  <div className="admin-form-field"><input type="text" placeholder="Title" value={materialForm.title} onChange={(e) => setMaterialForm((f) => ({ ...f, title: e.target.value }))} /></div>
                  <div className="admin-form-field"><textarea placeholder="Description (optional)" value={materialForm.description} onChange={(e) => setMaterialForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div className="admin-form-field"><input type="text" placeholder="URL (optional)" value={materialForm.url} onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))} /></div>
                  <div className="admin-form-field"><input type="text" placeholder="File URL (optional)" value={materialForm.fileUrl} onChange={(e) => setMaterialForm((f) => ({ ...f, fileUrl: e.target.value }))} /></div>
                  <button type="submit" disabled={savingMaterial} className="admin-btn admin-btn-primary">{savingMaterial ? 'Saving...' : editingMaterialId ? 'Update material' : 'Add material'}</button>
                </form>
              </div>
            </div>
          )}

          {selectedWeekId && weekDetails && (
            <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              <div>
                <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Current content</h3>
                {weekDetails.contentItems?.length ? (
                  <ul className="admin-cohort-item-list">
                    {weekDetails.contentItems.map((item) => (
                      <li key={item.id} className="admin-cohort-item-row">
                        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{item.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{item.type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button type="button" onClick={() => handleEditContent(item)} className="admin-btn admin-btn-ghost admin-btn-sm">Edit</button>
                          <button type="button" onClick={() => handleDeleteContent(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-form-hint">No content items yet.</p>
                )}
              </div>
              <div>
                <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Current materials</h3>
                {weekDetails.materials?.length ? (
                  <ul className="admin-cohort-item-list">
                    {weekDetails.materials.map((item) => (
                      <li key={item.id} className="admin-cohort-item-row">
                        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{item.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{item.type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button type="button" onClick={() => handleEditMaterial(item)} className="admin-btn admin-btn-ghost admin-btn-sm">Edit</button>
                          <button type="button" onClick={() => handleDeleteMaterial(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-form-hint">No materials yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title">Live classes</h2>
          <form onSubmit={handleCreateLiveClass} className="admin-form-group admin-action-group admin-cohort-live-form">
            <div className="admin-form-field">
              <select value={liveClassForm.weekId} onChange={(e) => setLiveClassForm((f) => ({ ...f, weekId: e.target.value }))}>
                <option value="">Select week</option>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <input type="datetime-local" value={liveClassForm.scheduledAt} onChange={(e) => setLiveClassForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="admin-form-field">
              <input type="text" placeholder="Google Meet link" value={liveClassForm.googleMeetLink} onChange={(e) => setLiveClassForm((f) => ({ ...f, googleMeetLink: e.target.value }))} />
            </div>
            <button type="submit" disabled={savingLiveClass} className="admin-btn admin-btn-primary admin-cohort-live-submit">
              {savingLiveClass ? 'Scheduling...' : 'Schedule live class'}
            </button>
          </form>

          {liveClasses.length === 0 ? (
            <p className="admin-form-hint" style={{ marginTop: '1rem' }}>No live classes scheduled yet.</p>
          ) : (
            <div className="admin-cohort-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-table-th">Week</th>
                    <th className="admin-table-th">Scheduled</th>
                    <th className="admin-table-th">Meet link</th>
                  </tr>
                </thead>
                <tbody>
                  {liveClasses.map((lc) => (
                    <tr key={lc.id} className="admin-table-tr">
                      <td className="admin-table-td" style={{ fontWeight: 500 }}>{lc.week_title || lc.week_number}</td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{lc.scheduled_at ? formatTimeLagos(lc.scheduled_at) : '—'}</td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lc.google_meet_link || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
          {facilitatorMessage && <p className="admin-form-hint" style={{ marginTop: '0.5rem', color: facilitatorMessage.includes('assigned') || facilitatorMessage.includes('removed') ? '#059669' : 'inherit' }}>{facilitatorMessage}</p>}

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

        <div className="admin-card">
          <h2 className="admin-card-title">Students ({students.length})</h2>
          {students.length === 0 ? (
            <p className="admin-form-hint">No students enrolled yet.</p>
          ) : (
            <div className="admin-cohort-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-table-th">Name</th>
                    <th className="admin-table-th">Email</th>
                    <th className="admin-table-th">Status</th>
                    <th className="admin-table-th">Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="admin-table-tr">
                      <td className="admin-table-td" style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{s.email}</td>
                      <td className="admin-table-td"><StatusBadge status={s.status || 'active'} /></td>
                      <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{formatDate(s.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
