'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

const emptyPortfolioForm = {
  slug: '',
  customDomain: '',
  headline: '',
  bio: '',
  resumeUrl: '',
  isPublic: false,
};

const emptyProjectForm = {
  title: '',
  description: '',
  linkUrl: '',
  imageUrl: '',
  orderIndex: 0,
};

const emptyLinkForm = {
  platform: '',
  url: '',
};

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState(emptyPortfolioForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [linkForm, setLinkForm] = useState(emptyLinkForm);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch('/api/portfolio', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setPortfolio(data.portfolio);
      setProjects(data.projects || []);
      setLinks(data.socialLinks || []);
      if (data.portfolio) {
        setForm({
          slug: data.portfolio.slug || '',
          customDomain: data.portfolio.custom_domain || '',
          headline: data.portfolio.headline || '',
          bio: data.portfolio.bio || '',
          resumeUrl: data.portfolio.resume_url || '',
          isPublic: data.portfolio.is_public === true,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const savePortfolio = async (e) => {
    e.preventDefault();
    setMessage('');
    setUploadMessage('');
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setPortfolio(data.portfolio);
      setMessage('Portfolio saved.');
    } else {
      setMessage(data.error || 'Failed to save portfolio.');
    }
  };

  const uploadFile = async ({ file, prefix, allowedTypes, maxSizeMb, onComplete }) => {
    if (!file) return;
    setUploading(true);
    setUploadMessage('');
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          prefix,
          allowedTypes,
          maxSizeMb,
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
      onComplete?.(presignData.fileUrl);
      setUploadMessage('Upload complete.');
    } catch (e) {
      setUploadMessage(e.message || 'Upload failed. You can paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    const endpoint = editingProjectId ? `/api/portfolio/projects/${editingProjectId}` : '/api/portfolio/projects';
    const method = editingProjectId ? 'PUT' : 'POST';
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify(projectForm),
    });
    setProjectForm(emptyProjectForm);
    setEditingProjectId(null);
    await loadData();
  };

  const deleteProject = async (id) => {
    await fetch(`/api/portfolio/projects/${id}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
    await loadData();
  };

  const saveLink = async (e) => {
    e.preventDefault();
    const endpoint = editingLinkId ? `/api/portfolio/social-links/${editingLinkId}` : '/api/portfolio/social-links';
    const method = editingLinkId ? 'PUT' : 'POST';
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify(linkForm),
    });
    setLinkForm(emptyLinkForm);
    setEditingLinkId(null);
    await loadData();
  };

  const deleteLink = async (id) => {
    await fetch(`/api/portfolio/social-links/${id}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
        <div className="h-8 w-48 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  const publicUrl = portfolio?.slug ? `/portfolio/${portfolio.slug}` : null;
  const domainStatus = portfolio?.domain_verified_at ? 'Verified' : portfolio?.custom_domain ? 'Pending verification' : null;

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Portfolio" subtitle="Build a public profile for recruiters and showcase your projects." icon={LmsIcons.briefcase}>
        {message && <p className="text-sm text-white/80 mt-2">{message}</p>}
        {publicUrl && portfolio?.is_public && (
          <p className="text-sm text-white/90 mt-2">
            Public profile: <Link href={publicUrl} className="underline text-white">{publicUrl}</Link>
          </p>
        )}
        {portfolio?.custom_domain && portfolio?.domain_verified_at && (
          <p className="text-sm text-white/90 mt-1">
            Custom domain: <a href={`https://${portfolio.custom_domain}`} target="_blank" rel="noreferrer" className="underline text-white">{portfolio.custom_domain}</a>
          </p>
        )}
      </LmsPageHeader>

      <LmsCard title="Profile details">
        <form onSubmit={savePortfolio} className="mt-4 space-y-4">
          <div>
            <label className="lms-form-label">Portfolio slug</label>
            <input
              type="text"
              placeholder="e.g. jane-doe"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="lms-form-label">Headline</label>
            <input
              type="text"
              placeholder="Your professional headline"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="lms-form-label">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell recruiters about yourself..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="lms-form-textarea w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="lms-form-label">Resume URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={form.resumeUrl}
              onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => uploadFile({
                file: e.target.files?.[0],
                prefix: 'portfolios/resumes',
                allowedTypes: ['pdf', 'doc', 'docx'],
                maxSizeMb: 10,
                onComplete: (url) => setForm((f) => ({ ...f, resumeUrl: url })),
              })}
              className="text-xs"
            />
            {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
            {uploadMessage && <span className="text-xs text-gray-500">{uploadMessage}</span>}
          </div>
          <div>
            <label className="lms-form-label">Custom domain</label>
            <input
              type="text"
              placeholder="e.g. portfolio.yourdomain.com"
              value={form.customDomain}
              onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          {domainStatus && (
            <p className="text-xs text-gray-500">
              Domain status: {domainStatus}
            </p>
          )}
          {portfolio?.domain_verification_token && form.customDomain && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Verify by pointing the domain to this site, then visit:</p>
              <p className="break-all">https://{form.customDomain}/api/portfolio/verify-domain?token={portfolio.domain_verification_token}</p>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
            />
            Make portfolio public
          </label>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Save profile
          </button>
        </form>
      </LmsCard>

      <hr className="lms-section-divider" />

      <LmsCard title="Projects" icon={LmsIcons.book}>
        <form onSubmit={saveProject} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Project title"
            value={projectForm.title}
            onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
            className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            rows={3}
            placeholder="Project description"
            value={projectForm.description}
            onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
            className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Project link"
              value={projectForm.linkUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={projectForm.imageUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadFile({
                file: e.target.files?.[0],
                prefix: 'portfolios/projects',
                allowedTypes: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
                maxSizeMb: 6,
                onComplete: (url) => setProjectForm((f) => ({ ...f, imageUrl: url })),
              })}
              className="text-xs"
            />
            {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            {editingProjectId ? 'Update project' : 'Add project'}
          </button>
          {editingProjectId && (
            <button
              type="button"
              onClick={() => {
                setEditingProjectId(null);
                setProjectForm(emptyProjectForm);
              }}
              className="ml-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </form>
        <div className="mt-6 space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects added yet.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{project.title}</p>
                    {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setProjectForm({
                          title: project.title || '',
                          description: project.description || '',
                          linkUrl: project.link_url || '',
                          imageUrl: project.image_url || '',
                          orderIndex: project.order_index || 0,
                        });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </LmsCard>

      <hr className="lms-section-divider" />

      <LmsCard title="Social links" icon={LmsIcons.chat}>
        <form onSubmit={saveLink} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Platform (e.g. LinkedIn)"
              value={linkForm.platform}
              onChange={(e) => setLinkForm((f) => ({ ...f, platform: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="URL"
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
            {editingLinkId ? 'Update link' : 'Add link'}
          </button>
          {editingLinkId && (
            <button
              type="button"
              onClick={() => {
                setEditingLinkId(null);
                setLinkForm(emptyLinkForm);
              }}
              className="ml-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </form>
        <div className="mt-6 space-y-3">
          {links.length === 0 ? (
            <p className="text-sm text-gray-500">No social links added.</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{link.platform}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLinkId(link.id);
                        setLinkForm({ platform: link.platform || '', url: link.url || '' });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLink(link.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{link.url}</p>
              </div>
            ))
          )}
        </div>
      </LmsCard>
    </div>
  );
}
