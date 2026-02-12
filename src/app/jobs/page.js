'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyJobId, setApplyJobId] = useState(null);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    resumeUrl: '',
    portfolioUrl: '',
    coverLetter: '',
  });
  const [applyMessage, setApplyMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    const res = await fetch(`/api/jobs?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    if (res.ok && data.jobs) setJobs(data.jobs);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const uploadResume = async (file) => {
    if (!file) return;
    setUploading(true);
    setApplyMessage('');
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          prefix: 'resumes',
          allowedTypes: ['pdf', 'doc', 'docx'],
          maxSizeMb: 10,
          fileSize: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to prepare upload');
      await fetch(presignData.uploadUrl, {
        method: presignData.method || 'PUT',
        headers: presignData.headers || {},
        body: file,
      });
      setApplyForm((prev) => ({ ...prev, resumeUrl: presignData.fileUrl }));
      setApplyMessage('Resume uploaded.');
    } catch (e) {
      setApplyMessage(e.message || 'Upload failed. Add a resume URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const submitApplication = async (jobId) => {
    setApplyMessage('');
    const res = await fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify(applyForm),
    });
    const data = await res.json();
    if (res.ok) {
      setApplyMessage('Application submitted.');
      setApplyJobId(null);
      setApplyForm({ name: '', email: '', resumeUrl: '', portfolioUrl: '', coverLetter: '' });
    } else {
      setApplyMessage(data.error || 'Failed to submit application.');
    }
  };

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '6rem 0 3rem' }}>
        <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
        <p className="text-gray-600 mt-2">Explore roles curated for CVERSE learners and alumni.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search roles or companies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
            className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </section>
      <section className="container" style={{ paddingBottom: '4rem' }}>
        {loading ? (
          <p className="text-gray-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">No jobs available right now.</p>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                    <p className="text-sm text-gray-600">{job.company || 'Company'} · {job.location || 'Remote'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.external_url && (
                      <a href={job.external_url} target="_blank" rel="noreferrer" className="text-sm text-primary font-medium">
                        External apply
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setApplyJobId(applyJobId === job.id ? null : job.id)}
                      className="text-sm text-primary font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                {job.description && <p className="text-sm text-gray-600 mt-3">{job.description}</p>}
                <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
                  {job.employment_type && <span>{job.employment_type}</span>}
                  {job.salary_range && <span>{job.salary_range}</span>}
                  {job.track_name && <span>{job.track_name}</span>}
                </div>
                {applyJobId === job.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    {applyMessage && <p className="text-xs text-gray-500 mb-2">{applyMessage}</p>}
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={applyForm.name}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Resume URL (optional)"
                        value={applyForm.resumeUrl}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Portfolio URL (optional)"
                        value={applyForm.portfolioUrl}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => uploadResume(e.target.files?.[0])}
                        className="text-xs"
                      />
                      {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Cover letter (optional)"
                      value={applyForm.coverLetter}
                      onChange={(e) => setApplyForm((prev) => ({ ...prev, coverLetter: e.target.value }))}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => submitApplication(job.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                      >
                        Submit application
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyJobId(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
