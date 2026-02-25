'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useToast } from '../components/ToastProvider';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function JobsPage() {
  const { showToast } = useToast();
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
  const [applyMessageType, setApplyMessageType] = useState('success');
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
      setApplyMessageType('success');
      setApplyMessage('Resume uploaded.');
    } catch (e) {
      setApplyMessage('');
      showToast({ type: 'error', message: e.message || 'Upload failed. Add a resume URL instead.' });
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
      setApplyMessageType('success');
      setApplyMessage('Application submitted.');
      setApplyJobId(null);
      setApplyForm({ name: '', email: '', resumeUrl: '', portfolioUrl: '', coverLetter: '' });
    } else {
      setApplyMessage('');
      showToast({ type: 'error', message: data.error || 'Failed to submit application.' });
    }
  };

  return (
    <main style={{ backgroundColor: 'var(--background-light)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <section className="container" style={{ padding: 'calc(var(--header-offset) + 2.5rem) 1.5rem 2rem', maxWidth: 900 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
          Job Board
        </h1>
        <p style={{ color: 'var(--text-light)', marginTop: '0.375rem', fontSize: '1.0625rem' }}>
          Explore roles curated for CVERSE learners and alumni.
        </p>
        <div style={{ marginTop: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search roles or companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
            className="auth-input"
            style={{ maxWidth: 420 }}
          />
        </div>
      </section>

      {/* Job list */}
      <section className="container" style={{ paddingBottom: '4rem', maxWidth: 900 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="lms-skeleton" style={{ height: 120, borderRadius: 12 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div
            style={{
              textAlign: 'center', padding: '3rem 1rem',
              background: 'var(--background-color)', borderRadius: 16,
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{ color: 'var(--text-light)' }}>No jobs available right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                className="portfolio-project-card"
                style={{
                  background: 'var(--background-color)', borderRadius: 14,
                  border: '1px solid var(--border-color)',
                  padding: '1.5rem', boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-color)' }}>{job.title}</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                      {job.company || 'Company'} · {job.location || 'Remote'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {job.external_url && (
                      <a
                        href={job.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="lms-btn lms-btn-secondary lms-btn-sm"
                      >
                        External
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setApplyJobId(applyJobId === job.id ? null : job.id)}
                      className="lms-btn lms-btn-primary lms-btn-sm"
                    >
                      {applyJobId === job.id ? 'Close' : 'Apply'}
                    </button>
                  </div>
                </div>

                {job.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.6, marginTop: '0.75rem' }}>
                    {job.description}
                  </p>
                )}

                {(job.employment_type || job.salary_range || job.track_name) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {job.employment_type && <span className="lms-badge lms-badge-info">{job.employment_type}</span>}
                    {job.salary_range && <span className="lms-badge lms-badge-success">{job.salary_range}</span>}
                    {job.track_name && <span className="lms-badge lms-badge-neutral">{job.track_name}</span>}
                  </div>
                )}

                {applyJobId === job.id && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                    {applyMessage && applyMessageType === 'success' && (
                      <p className="lms-alert lms-alert-info" style={{ marginBottom: '0.75rem' }}>{applyMessage}</p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={applyForm.name}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="auth-input"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="auth-input"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Resume URL (optional)"
                        value={applyForm.resumeUrl}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                        className="auth-input"
                      />
                      <input
                        type="text"
                        placeholder="Portfolio URL (optional)"
                        value={applyForm.portfolioUrl}
                        onChange={(e) => setApplyForm((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                        className="auth-input"
                      />
                    </div>

                    <label className="file-upload-area" style={{ marginTop: '0.75rem' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => uploadResume(e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                      <span className="file-upload-area-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </span>
                      <span className="file-upload-area-text">
                        {uploading ? 'Uploading…' : <><strong>Click to upload</strong> your resume (PDF, DOC)</>}
                      </span>
                      <span className="file-upload-area-hint">Max 10 MB</span>
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Cover letter (optional)"
                      value={applyForm.coverLetter}
                      onChange={(e) => setApplyForm((prev) => ({ ...prev, coverLetter: e.target.value }))}
                      className="auth-input"
                      style={{ marginTop: '0.75rem', resize: 'vertical', minHeight: 80 }}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => submitApplication(job.id)} className="lms-btn lms-btn-primary">
                        Submit application
                      </button>
                      <button type="button" onClick={() => setApplyJobId(null)} className="lms-btn lms-btn-secondary">
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
