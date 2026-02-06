'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
          fetch(`/api/assignments/${id}`, { headers: getAuthHeaders() }),
          fetch(`/api/assignments/${id}/my-submission`, { headers: getAuthHeaders() }),
        ]);
        const assignData = await assignRes.json();
        const subData = await subRes.json();
        if (assignRes.ok && assignData.assignment) setAssignment(assignData.assignment);
        if (subRes.ok && subData.submission) setSubmission(subData.submission);
      } catch (e) {
        console.error(e);
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Assignment not found.</p>
        <Link href="/dashboard/assignments" className="text-primary font-medium mt-4 inline-block">Back to assignments</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/assignments" className="text-sm text-gray-500 hover:text-primary">← Assignments</Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
        {assignment.description && (
          <div className="mt-4 text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: assignment.description }} />
        )}
        <p className="mt-4 text-sm text-gray-500">Due {formatDate(assignment.deadline_at)} · Max score: {assignment.max_score ?? 100}</p>
      </div>

      {submission ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your submission</h2>
          <p className="text-sm text-gray-500 mt-1">Submitted {formatDate(submission.submitted_at)}</p>
          {submission.link_url && <p className="mt-2"><a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open link</a></p>}
          {submission.file_url && <p className="mt-2"><a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary">Open file</a></p>}
          {submission.text_content && <p className="mt-2 text-gray-700">{submission.text_content}</p>}
          {submission.status === 'graded' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Score: {submission.score} / {assignment.max_score ?? 100}</p>
              {submission.feedback && <p className="mt-2 text-gray-600">{submission.feedback}</p>}
            </div>
          )}
        </div>
      ) : !deadlinePassed && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Submit</h2>
          {message && <p className={`mt-2 text-sm ${message.startsWith('Submit') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {(assignment.submission_type === 'link' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            )}
            {(assignment.submission_type === 'text' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Text</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Your response..."
                />
              </div>
            )}
            {(assignment.submission_type === 'file_upload' || assignment.submission_type === 'multiple') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">File upload</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full"
                />
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                {uploadedFileUrl && !uploading && <p className="text-sm text-green-600 mt-2">File uploaded.</p>}
                {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {deadlinePassed && !submission && (
        <p className="text-gray-500">The deadline for this assignment has passed.</p>
      )}
    </div>
  );
}
