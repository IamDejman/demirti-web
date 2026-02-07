'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
  AdminTable,
  AdminEmptyState,
} from '../../components/admin';

import { getAuthHeaders } from '@/lib/authClient';

const emptyForm = {
  title: '',
  company: '',
  location: '',
  employmentType: '',
  salaryRange: '',
  description: '',
  externalUrl: '',
  trackId: '',
  isActive: true,
};

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [jobFilter, setJobFilter] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadData = async (withApps = true) => {
    const [jobRes, trackRes] = await Promise.all([
      fetch('/api/admin/jobs', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
    ]);
    const jobData = await jobRes.json();
    const trackData = await trackRes.json();
    if (jobRes.ok && jobData.jobs) setJobs(jobData.jobs);
    if (trackRes.ok && trackData.tracks) setTracks(trackData.tracks);
    if (withApps) await loadApplications(jobFilter);
  };

  const loadApplications = async (jobId) => {
    const params = new URLSearchParams();
    if (jobId) params.set('jobId', jobId);
    const res = await fetch(`/api/admin/job-applications?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.applications) setApplications(data.applications);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.title.trim()) return;
    const endpoint = editingId ? `/api/admin/jobs/${editingId}` : '/api/admin/jobs';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageType('success');
      setMessage(editingId ? 'Job updated.' : 'Job created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
      setMessageType('error');
      setMessage(data.error || 'Failed to save job');
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      employmentType: job.employment_type || '',
      salaryRange: job.salary_range || '',
      description: job.description || '',
      externalUrl: job.external_url || '',
      trackId: job.track_id || '',
      isActive: job.is_active !== false,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await loadData();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const applicationColumns = [
    { key: 'job_title', label: 'Job', render: (app) => app.job_title },
    { key: 'applicant', label: 'Applicant', render: (app) => app.name || app.user_email || 'Applicant' },
    { key: 'email', label: 'Email', render: (app) => app.email || app.user_email || '-' },
    {
      key: 'resume',
      label: 'Resume',
      render: (app) =>
        app.resume_url ? (
          <a href={app.resume_url} target="_blank" rel="noreferrer" className="admin-link admin-link-primary">
            Resume
          </a>
        ) : (
          <span className="admin-meta">—</span>
        ),
    },
    {
      key: 'cover_letter',
      label: 'Cover letter',
      render: (app) =>
        app.cover_letter ? (
          <span>{app.cover_letter.slice(0, 80)}{app.cover_letter.length > 80 ? '…' : ''}</span>
        ) : (
          <span className="admin-meta">—</span>
        ),
    },
    { key: 'submitted', label: 'Submitted', render: (app) => new Date(app.created_at).toLocaleDateString() },
  ];

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Job Board"
        description="Create and manage job listings. View applications from the job board."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      <AdminCard title={editingId ? 'Edit job' : 'Create job'}>
        <form onSubmit={handleSubmit} className="admin-form-section">
          <AdminFormField label="Title">
            <input
              type="text"
              placeholder="Job title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="Company">
              <input
                type="text"
                placeholder="Company name"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="Location">
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
          </div>
          <div className="admin-form-grid">
            <AdminFormField label="Employment type">
              <input
                type="text"
                placeholder="e.g. Full-time, Remote"
                value={form.employmentType}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="Salary range">
              <input
                type="text"
                placeholder="e.g. $50k–80k"
                value={form.salaryRange}
                onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
          </div>
          <AdminFormField label="Description">
            <textarea
              rows={4}
              placeholder="Job description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </AdminFormField>
          <div className="admin-form-grid">
            <AdminFormField label="External URL">
              <input
                type="text"
                placeholder="https://..."
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className={inputClass}
              />
            </AdminFormField>
            <AdminFormField label="Track">
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className={inputClass}
              >
                <option value="">All tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </AdminFormField>
          </div>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Active</span>
          </label>
          <div className="admin-action-group" style={{ marginTop: '1rem' }}>
            <AdminButton type="submit" variant="primary">
              {editingId ? 'Update' : 'Publish'}
            </AdminButton>
            {editingId && (
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Jobs">
        {jobs.length === 0 ? (
          <AdminEmptyState message="No jobs yet." description="Create a job above." />
        ) : (
          <ul className="admin-list">
            {jobs.map((job) => (
              <li key={job.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <p className="admin-list-item-title">{job.title}</p>
                  <div className="admin-action-group">
                    <button type="button" onClick={() => handleEdit(job)} className="admin-link admin-link-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(job.id)} className="admin-link admin-link-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  {job.company || 'Company'} · {job.location || 'Remote'}
                  {job.track_name ? ` · ${job.track_name}` : ''}
                  {!job.is_active ? ' · Inactive' : ''}
                </p>
                {job.description && <p className="admin-list-item-body">{job.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Job applications">
        <div className="admin-card-toolbar">
          <select
            value={jobFilter}
            onChange={async (e) => {
              const value = e.target.value;
              setJobFilter(value);
              await loadApplications(value);
            }}
            className={inputClass}
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <option value="">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <AdminButton variant="secondary" onClick={() => loadApplications(jobFilter)}>
            Refresh
          </AdminButton>
        </div>
        {applications.length === 0 ? (
          <AdminEmptyState message="No applications yet." description="Applications will appear here when users apply." />
        ) : (
          <AdminTable columns={applicationColumns} data={applications} rowKey="id" />
        )}
      </AdminCard>
    </div>
  );
}
