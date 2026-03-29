'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  AdminCard,
  AdminFormField,
  AdminButton,
  AdminMessage,
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

const STATUS_CONFIG = {
  active: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Active' },
  inactive: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Inactive' },
};

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
};

function StatusBadge({ active }) {
  const config = active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
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
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, borderColor }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 140,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        borderTop: `3px solid ${borderColor}`,
        padding: '1.25rem 1rem',
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

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

  const activeJobs = jobs.filter((j) => j.is_active !== false).length;

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Job Board"
        description="Create and manage job listings. View applications from the job board."
      />

      {message && <AdminMessage type={messageType}>{message}</AdminMessage>}

      {/* Stats overview */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard label="Total Jobs" value={jobs.length} borderColor="#2563eb" />
        <StatCard label="Active Jobs" value={activeJobs} borderColor="#059669" />
        <StatCard label="Total Applications" value={applications.length} borderColor="#7c3aed" />
      </div>

      {/* Create / Edit form */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          {editingId ? 'Edit job' : 'Create job'}
        </h3>
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
                placeholder="e.g. $50k-80k"
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
      </div>

      {/* Jobs list */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          Jobs
        </h3>
        {jobs.length === 0 ? (
          <AdminEmptyState message="No jobs yet." description="Create a job above." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  padding: '0.875rem 1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
                      {job.title}
                    </span>
                    <StatusBadge active={job.is_active !== false} />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.25rem',
                      flexWrap: 'wrap',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div>
                      <span style={labelStyle}>Company</span>
                      <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                        {job.company || '--'}
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>Location</span>
                      <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                        {job.location || 'Remote'}
                      </div>
                    </div>
                    {job.track_name && (
                      <div>
                        <span style={labelStyle}>Track</span>
                        <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                          {job.track_name}
                        </div>
                      </div>
                    )}
                    {job.employment_type && (
                      <div>
                        <span style={labelStyle}>Type</span>
                        <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                          {job.employment_type}
                        </div>
                      </div>
                    )}
                    {job.salary_range && (
                      <div>
                        <span style={labelStyle}>Salary</span>
                        <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                          {job.salary_range}
                        </div>
                      </div>
                    )}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      {job.description.length > 120 ? job.description.slice(0, 120) + '...' : job.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, paddingTop: '0.125rem' }}>
                  <AdminButton variant="secondary" onClick={() => handleEdit(job)} style={{ fontSize: '0.8125rem' }}>
                    Edit
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => handleDelete(job.id)} style={{ fontSize: '0.8125rem' }}>
                    Delete
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applications */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            Job Applications
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        </div>
        {applications.length === 0 ? (
          <AdminEmptyState message="No applications yet." description="Applications will appear here when users apply." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {applications.map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  padding: '0.875rem 1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
                    {app.name || app.user_email || 'Applicant'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.25rem',
                      flexWrap: 'wrap',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div>
                      <span style={labelStyle}>Job</span>
                      <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                        {app.job_title}
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>Email</span>
                      <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                        {app.email || app.user_email || '--'}
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>Submitted</span>
                      <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: '0.125rem' }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {app.cover_letter && (
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      {app.cover_letter.length > 120 ? app.cover_letter.slice(0, 120) + '...' : app.cover_letter}
                    </p>
                  )}
                </div>
                <div style={{ flexShrink: 0, paddingTop: '0.125rem' }}>
                  {app.resume_url ? (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: '#2563eb',
                        textDecoration: 'none',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 6,
                        border: '1px solid #2563eb30',
                        background: 'rgba(37, 99, 235, 0.05)',
                      }}
                    >
                      View Resume
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>No resume</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
