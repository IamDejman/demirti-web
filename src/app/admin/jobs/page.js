'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [jobFilter, setJobFilter] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async (withApps = true) => {
    const [jobRes, trackRes] = await Promise.all([
      fetch('/api/admin/jobs', { headers: getAuthHeaders() }),
      fetch('/api/tracks', { headers: getAuthHeaders() }),
    ]);
    const jobData = await jobRes.json();
    const trackData = await trackRes.json();
    if (jobRes.ok && jobData.jobs) setJobs(jobData.jobs);
    if (trackRes.ok && trackData.tracks) setTracks(trackData.tracks);
    if (withApps) {
      await loadApplications(jobFilter);
    }
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
      setMessage(editingId ? 'Job updated.' : 'Job created.');
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } else {
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

  return (
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit job' : 'Create job'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Employment type"
                value={form.employmentType}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Salary range"
                value={form.salaryRange}
                onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="External URL"
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={form.trackId}
                onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.track_name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
              {editingId ? 'Update' : 'Publish'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="ml-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No jobs yet.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(job)} className="text-xs text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => handleDelete(job.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.company || 'Company'} · {job.location || 'Remote'} {job.track_name ? `· ${job.track_name}` : ''} {job.is_active ? '' : '· Inactive'}
                  </p>
                  {job.description && <p className="text-sm text-gray-500 mt-1">{job.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Job applications</h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={jobFilter}
                onChange={async (e) => {
                  const value = e.target.value;
                  setJobFilter(value);
                  await loadApplications(value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => loadApplications(jobFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Job</th>
                    <th className="py-2">Applicant</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Resume</th>
                    <th className="py-2">Cover letter</th>
                    <th className="py-2">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t border-gray-100">
                      <td className="py-2">{app.job_title}</td>
                      <td className="py-2">{app.name || app.user_email || 'Applicant'}</td>
                      <td className="py-2">{app.email || app.user_email || '-'}</td>
                      <td className="py-2">
                        {app.resume_url ? (
                          <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-primary text-xs">
                            Resume
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {app.cover_letter ? (
                          <span className="text-xs text-gray-600">{app.cover_letter.slice(0, 80)}{app.cover_letter.length > 80 ? '…' : ''}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2">{new Date(app.created_at).toLocaleDateString()}</td>
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
