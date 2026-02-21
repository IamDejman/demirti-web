'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/sanitize';
import { LmsCard, LmsEmptyState, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatTimeLagos } from '@/lib/dateUtils';

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [assignRes, subRes] = await Promise.all([
          fetch(`/api/assignments/${id}`, { headers: getLmsAuthHeaders() }),
          fetch(`/api/assignments/${id}/my-submission`, { headers: getLmsAuthHeaders() }),
        ]);
        const assignData = await assignRes.json();
        const subData = await subRes.json();
        if (assignRes.ok && assignData.assignment) setAssignment(assignData.assignment);
        if (subRes.ok && subData.submission) setSubmission(subData.submission);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setUploadError('');
    setUploadedFileUrl('');
    if (!assignment) return;
    try {
      setUploading(true);
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          filename: selected.name,
          contentType: selected.type || 'application/octet-stream',
          prefix: `assignments/${assignment.id}`,
          allowedTypes: assignment.allowed_file_types || null,
          maxSizeMb: assignment.max_file_size_mb ?? null,
          fileSize: selected.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setUploadError(presignData.error || 'Failed to get upload URL');
        return;
      }
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: presignData.method || 'PUT',
        headers: {
          ...(presignData.headers || {}),
          'Content-Type': selected.type || 'application/octet-stream',
        },
        body: selected,
      });
      if (!uploadRes.ok) {
        setUploadError('Upload failed. Please try again.');
        return;
      }
      setUploadedFileUrl(presignData.fileUrl);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignment) return;
    setSubmitting(true);
    setMessage('');
    try {
      if ((assignment.submission_type === 'file_upload' || assignment.submission_type === 'multiple') && file && !uploadedFileUrl) {
        setMessage('Please wait for the file upload to finish.');
        setSubmitting(false);
        return;
      }
      if (assignment.submission_type === 'file_upload' && !uploadedFileUrl) {
        setMessage('Please upload a file before submitting.');
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/assignments/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          submissionType: assignment.submission_type || 'text',
          fileUrl: uploadedFileUrl || undefined,
          fileName: file?.name || undefined,
          fileSize: file?.size || undefined,
          linkUrl: linkUrl.trim() || undefined,
          textContent: textContent.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.submission) {
        setSubmission(data.submission);
        setMessage('Submitted successfully.');
      } else {
        setMessage(data.error || 'Submit failed');
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => formatTimeLagos(d);
  const deadlinePassed = assignment?.deadline_at && new Date(assignment.deadline_at) < new Date();
  const hasLink = linkUrl?.trim();
  const hasText = textContent?.trim();
  const hasFile = Boolean(uploadedFileUrl);
  const canSubmit = assignment?.submission_type === 'multiple'
    ? (hasLink || hasText || hasFile)
    : assignment?.submission_type === 'link'
      ? hasLink
      : assignment?.submission_type === 'file_upload'
        ? hasFile
        : hasText;

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="lms-skeleton rounded-xl" style={{ height: 160 }} />
        <div className="lms-skeleton rounded-xl" style={{ height: 280 }} />
      </div>
    );
  }

  if (!assignment) {
    return (
      <LmsCard hoverable={false}>
        <LmsEmptyState
          icon={LmsIcons.inbox}
          title="Assignment not found"
          action={<Link href="/dashboard/assignments" className="lms-link">Back to assignments</Link>}
        />
      </LmsCard>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title={assignment.title}
        subtitle={`Due ${formatDate(assignment.deadline_at)} · Max score: ${assignment.max_score ?? 100}`}
        icon={LmsIcons.clipboard}
        breadcrumb={{ href: '/dashboard/assignments', label: 'Assignments' }}
      />
      <LmsCard title="Details" hoverable={false}>
        {assignment.description && (
          <div className="prose prose-sm max-w-none text-[var(--neutral-600)]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.description) }} />
        )}
        <p className="mt-4 text-sm text-[var(--neutral-500)]">Due {formatDate(assignment.deadline_at)} · Max score: {assignment.max_score ?? 100}</p>
      </LmsCard>

      {submission ? (
        <LmsCard title="Your submission" subtitle={`Submitted ${formatDate(submission.submitted_at)}`}>
          <div className="flex gap-2 mb-3">
            {submission.status === 'graded' ? (
              <LmsBadge variant="success">Graded</LmsBadge>
            ) : (
              <LmsBadge variant="info" dot>Submitted</LmsBadge>
            )}
          </div>
          {submission.link_url && <p className="mt-2"><a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="lms-link">Open link</a></p>}
          {submission.file_url && <p className="mt-2"><a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="lms-link">Open file</a></p>}
          {submission.text_content && <p className="mt-2 text-[var(--neutral-700)]">{submission.text_content}</p>}
          {submission.status === 'graded' && (
            <div className="lms-score-card">
              <div className="flex items-center gap-4">
                <div className="lms-score-card-fill">
                  <span>{submission.score}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--neutral-500)]">Your score</p>
                  <p className="text-lg font-bold text-[var(--neutral-900)]">{submission.score} / {assignment.max_score ?? 100}</p>
                </div>
              </div>
              {submission.feedback && (
                <div className="mt-4 pt-4 border-t border-[var(--neutral-200)]">
                  <p className="text-sm font-medium mb-1 text-[var(--neutral-700)]">Facilitator feedback</p>
                  <p className="text-sm text-[var(--neutral-600)]">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </LmsCard>
      ) : !deadlinePassed && (
        <LmsCard title="Submit">
          {message && (
            <div className={`lms-alert mb-4 ${message.startsWith('Submit') || message.includes('fail') || message.includes('wrong') ? 'lms-alert-error' : 'lms-alert-success'}`} role="alert" aria-live="polite">
              {message}
            </div>
          )}
          {uploadError && (
            <div className="lms-alert lms-alert-error mb-4" role="alert">{uploadError}</div>
          )}
          {uploadedFileUrl && !uploading && (
            <div className="lms-alert lms-alert-success mb-4" role="alert">File uploaded.</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col mt-4" style={{ gap: 'var(--lms-space-4)' }}>
            {(assignment.submission_type === 'link' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="lms-form-label block mb-1.5">Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="lms-form-input border-token block w-full px-3 py-2 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            )}
            {(assignment.submission_type === 'text' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="lms-form-label block mb-1.5">Text</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  className="lms-form-textarea border-token block w-full px-3 py-2 rounded-lg"
                  placeholder="Your response..."
                />
              </div>
            )}
            {(assignment.submission_type === 'file_upload' || assignment.submission_type === 'multiple') && (
              <div>
                <span className="lms-form-label block mb-1.5">File upload</span>
                <label className="file-upload-area">
                  <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                  <span className="file-upload-area-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </span>
                  <span className="file-upload-area-text">
                    {uploading ? 'Uploading…' : <><strong>Click to upload</strong> your file</>}
                  </span>
                </label>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="lms-btn lms-btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit assignment'}
            </button>
          </form>
        </LmsCard>
      )}

      {deadlinePassed && !submission && (
        <LmsCard hoverable={false}>
          <div className="flex items-center gap-2">
            <LmsBadge variant="danger">Deadline passed</LmsBadge>
            <span className="text-sm text-[var(--neutral-500)]">The deadline for this assignment has passed.</span>
          </div>
        </LmsCard>
      )}
    </div>
  );
}
