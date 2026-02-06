'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
      } catch (e) {
        console.error(e);
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <p className="text-gray-500">Loading...</p>
        </div>
    );
  }

  if (!cohort) {
    return (
      <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <p className="text-gray-600">Cohort not found.</p>
          <Link href="/admin/cohorts" className="text-primary font-medium mt-4 inline-block">Back to cohorts</Link>
        </div>
    );
  }

  const enrolledEmails = new Set(students.map((s) => s.email));
  const paidNotEnrolled = applications.filter((a) => a.status === 'paid' && !enrolledEmails.has(a.email));

  return (
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weeks and content</h2>
          {lmsMessage && <p className="text-sm text-gray-600 mb-4">{lmsMessage}</p>}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Create week</h3>
              <form onSubmit={handleCreateWeek} className="space-y-3">
                <input
                  type="number"
                  placeholder="Week number"
                  value={weekForm.weekNumber}
                  onChange={(e) => setWeekForm((f) => ({ ...f, weekNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Week title"
                  value={weekForm.title}
                  onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={weekForm.description}
                  onChange={(e) => setWeekForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="datetime-local"
                  value={weekForm.unlockDate}
                  onChange={(e) => setWeekForm((f) => ({ ...f, unlockDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="datetime-local"
                  value={weekForm.liveClassDatetime}
                  onChange={(e) => setWeekForm((f) => ({ ...f, liveClassDatetime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Google Meet link (optional)"
                  value={weekForm.googleMeetLink}
                  onChange={(e) => setWeekForm((f) => ({ ...f, googleMeetLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!weekForm.isLocked}
                    onChange={(e) => setWeekForm((f) => ({ ...f, isLocked: !e.target.checked }))}
                  />
                  Unlock immediately
                </label>
                <button type="submit" disabled={savingWeek} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
                  {savingWeek ? 'Saving...' : 'Create week'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Select week</h3>
              <select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a week</option>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    Week {w.week_number} · {w.title}
                  </option>
                ))}
              </select>

              {weekDetails && (
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Title:</strong> {weekDetails.week.title}</p>
                  <p><strong>Unlock:</strong> {weekDetails.week.unlock_date ? new Date(weekDetails.week.unlock_date).toLocaleString() : '—'}</p>
                </div>
              )}
            </div>
          </div>

          {selectedWeekId && (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Add content item</h3>
                <form onSubmit={handleCreateContent} className="space-y-3">
                  <select
                    value={contentForm.type}
                    onChange={(e) => setContentForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pdf">PDF</option>
                    <option value="slides">Slides</option>
                    <option value="video_embed">Video</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="recording">Recording</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title"
                    value={contentForm.title}
                    onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={contentForm.description}
                    onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="File URL (optional)"
                    value={contentForm.fileUrl}
                    onChange={(e) => setContentForm((f) => ({ ...f, fileUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="External URL (optional)"
                    value={contentForm.externalUrl}
                    onChange={(e) => setContentForm((f) => ({ ...f, externalUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Order index"
                    value={contentForm.orderIndex}
                    onChange={(e) => setContentForm((f) => ({ ...f, orderIndex: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={contentForm.isDownloadable}
                      onChange={(e) => setContentForm((f) => ({ ...f, isDownloadable: e.target.checked }))}
                    />
                    Downloadable
                  </label>
                  <button type="submit" disabled={savingContent} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
                    {savingContent ? 'Saving...' : editingContentId ? 'Update content' : 'Add content'}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Add material</h3>
                <form onSubmit={handleCreateMaterial} className="space-y-3">
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="book">Book</option>
                    <option value="software">Software</option>
                    <option value="starter_file">Starter file</option>
                    <option value="resource">Resource</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="URL (optional)"
                    value={materialForm.url}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="File URL (optional)"
                    value={materialForm.fileUrl}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, fileUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button type="submit" disabled={savingMaterial} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
                    {savingMaterial ? 'Saving...' : editingMaterialId ? 'Update material' : 'Add material'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {selectedWeekId && weekDetails && (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Current content</h3>
                {weekDetails.contentItems?.length ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {weekDetails.contentItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-gray-500 ml-2">{item.type}</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEditContent(item)} className="text-xs text-primary hover:underline">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteContent(item.id)} className="text-xs text-red-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No content items yet.</p>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Current materials</h3>
                {weekDetails.materials?.length ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {weekDetails.materials.map((item) => (
                      <li key={item.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-gray-500 ml-2">{item.type}</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEditMaterial(item)} className="text-xs text-primary hover:underline">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteMaterial(item.id)} className="text-xs text-red-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No materials yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live classes</h2>
          <form onSubmit={handleCreateLiveClass} className="grid gap-3 md:grid-cols-3">
            <select
              value={liveClassForm.weekId}
              onChange={(e) => setLiveClassForm((f) => ({ ...f, weekId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select week</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={liveClassForm.scheduledAt}
              onChange={(e) => setLiveClassForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Google Meet link"
              value={liveClassForm.googleMeetLink}
              onChange={(e) => setLiveClassForm((f) => ({ ...f, googleMeetLink: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button type="submit" disabled={savingLiveClass} className="md:col-span-3 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
              {savingLiveClass ? 'Scheduling...' : 'Schedule live class'}
            </button>
          </form>

          {liveClasses.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">No live classes scheduled yet.</p>
          ) : (
            <table className="w-full mt-4">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Week</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Scheduled</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Meet link</th>
                </tr>
              </thead>
              <tbody>
                {liveClasses.map((lc) => (
                  <tr key={lc.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-gray-900">{lc.week_title || lc.week_number}</td>
                    <td className="py-3 px-4 text-gray-600">{lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{lc.google_meet_link || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Facilitators</h2>
          <form onSubmit={handleAssignFacilitator} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Facilitator email</label>
              <input
                type="email"
                value={facilitatorEmail}
                onChange={(e) => setFacilitatorEmail(e.target.value)}
                placeholder="facilitator@example.com"
                className="mt-1 block w-64 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button type="submit" disabled={assigningFacilitator} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
              {assigningFacilitator ? 'Assigning...' : 'Assign'}
            </button>
          </form>
          {facilitatorMessage && <p className="mt-2 text-sm text-gray-600">{facilitatorMessage}</p>}

          {facilitators.length === 0 ? (
            <p className="text-gray-500 mt-4">No facilitators assigned yet.</p>
          ) : (
            <table className="w-full mt-4">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {facilitators.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 font-medium text-gray-900">{f.first_name} {f.last_name}</td>
                    <td className="py-3 px-4 text-gray-600">{f.email}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(f.assigned_at)}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveFacilitator(f.id)}
                        disabled={assigningFacilitator}
                        className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
  );
}
