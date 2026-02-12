'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { LmsCard, LmsEmptyState, LmsPageHeader, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

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

  const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');
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
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <LmsCard hoverable={false}>
        <LmsEmptyState
          icon={LmsIcons.inbox}
          title="Assignment not found"
          action={<Link href="/dashboard/assignments" className="text-primary font-medium hover:underline">Back to assignments</Link>}
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
          <div className="prose prose-sm max-w-none" style={{ color: 'var(--neutral-600)' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assignment.description, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'code', 'pre'] }) }} />
        )}
        <p className="mt-4 text-sm" style={{ color: 'var(--neutral-500)' }}>Due {formatDate(assignment.deadline_at)} · Max score: {assignment.max_score ?? 100}</p>
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
          {submission.link_url && <p className="mt-2"><a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open link</a></p>}
          {submission.file_url && <p className="mt-2"><a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open file</a></p>}
          {submission.text_content && <p className="mt-2" style={{ color: 'var(--neutral-700)' }}>{submission.text_content}</p>}
          {submission.status === 'graded' && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--neutral-50)' }}>
              <p className="font-medium" style={{ color: 'var(--neutral-900)' }}>Score: {submission.score} / {assignment.max_score ?? 100}</p>
              {submission.feedback && <p className="mt-2" style={{ color: 'var(--neutral-600)' }}>{submission.feedback}</p>}
            </div>
          )}
        </LmsCard>
      ) : !deadlinePassed && (
        <LmsCard title="Submit">
          {message && <p className={`mt-2 text-sm ${message.startsWith('Submit') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {(assignment.submission_type === 'link' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="lms-form-label block">Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="lms-form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            )}
            {(assignment.submission_type === 'text' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="lms-form-label block">Text</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="lms-form-textarea mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Your response..."
                />
              </div>
            )}
            {(assignment.submission_type === 'file_upload' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="lms-form-label block">File upload</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full"
                />
                {uploading && <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>Uploading...</p>}
                {uploadedFileUrl && !uploading && <p className="text-sm text-green-600 mt-2">File uploaded.</p>}
                {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !canSubmit}
                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </LmsCard>
      )}

      {deadlinePassed && !submission && (
        <LmsCard hoverable={false}>
          <div className="flex items-center gap-2">
            <LmsBadge variant="danger">Deadline passed</LmsBadge>
            <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>The deadline for this assignment has passed.</span>
          </div>
        </LmsCard>
      )}
    </div>
  );
}
