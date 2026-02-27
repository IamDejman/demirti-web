'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { useToast } from '@/app/components/ToastProvider';

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

const inputCls = 'lms-form-input border-token w-full px-4 py-2.5 rounded-lg';
const textareaCls = 'lms-form-textarea border-token w-full px-4 py-2.5 rounded-xl resize-y';

const PORTFOLIO_GAP_STYLE = { gap: 'var(--lms-space-8)' };
const PORTFOLIO_GAP_6_STYLE = { gap: 'var(--lms-space-6)' };
const PORTFOLIO_GRID_GAP_STYLE = { gap: 'var(--lms-space-4)' };

export default function PortfolioPage() {
  const { showToast } = useToast();
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
      showToast({ type: 'error', message: data.error || 'Failed to save portfolio.' });
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
      setUploadMessage('');
      showToast({ type: 'error', message: e.message || 'Upload failed. You can paste a URL instead.' });
    } finally {
      setUploading(false);
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingProjectId ? `/api/portfolio/projects/${editingProjectId}` : '/api/portfolio/projects';
      const method = editingProjectId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify(projectForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: data.error || 'Failed to save project.' });
        return;
      }
      setProjectForm(emptyProjectForm);
      setEditingProjectId(null);
      await loadData();
    } catch {
      showToast({ type: 'error', message: 'Network error saving project.' });
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`/api/portfolio/projects/${id}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
      if (!res.ok) {
        showToast({ type: 'error', message: 'Failed to delete project.' });
        return;
      }
      await loadData();
    } catch {
      showToast({ type: 'error', message: 'Network error deleting project.' });
    }
  };

  const saveLink = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingLinkId ? `/api/portfolio/social-links/${editingLinkId}` : '/api/portfolio/social-links';
      const method = editingLinkId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify(linkForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: data.error || 'Failed to save link.' });
        return;
      }
      setLinkForm(emptyLinkForm);
      setEditingLinkId(null);
      await loadData();
    } catch {
      showToast({ type: 'error', message: 'Network error saving link.' });
    }
  };

  const deleteLink = async (id) => {
    try {
      const res = await fetch(`/api/portfolio/social-links/${id}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
      if (!res.ok) {
        showToast({ type: 'error', message: 'Failed to delete link.' });
        return;
      }
      await loadData();
    } catch {
      showToast({ type: 'error', message: 'Network error deleting link.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col" style={PORTFOLIO_GAP_STYLE}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="h-32 lms-skeleton rounded-xl" />
        <div className="h-80 lms-skeleton rounded-xl" />
        <div className="h-72 lms-skeleton rounded-xl" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  const publicUrl = portfolio?.slug ? `/portfolio/${portfolio.slug}` : null;
  const domainStatus = portfolio?.domain_verified_at ? 'Verified' : portfolio?.custom_domain ? 'Pending verification' : null;

  return (
    <div className="flex flex-col" style={PORTFOLIO_GAP_STYLE}>
      <LmsPageHeader
        title="Portfolio"
        subtitle="Build a public profile for recruiters and showcase your projects."
        icon={LmsIcons.briefcase}
      />

      {(message || publicUrl || portfolio?.custom_domain) && (
        <div className="lms-info-banner flex flex-col gap-3 text-sm">
          {message && (
            <div className="lms-alert lms-alert-success" role="alert">
              {message}
            </div>
          )}
          {publicUrl && portfolio?.is_public && (
            <div className={message ? 'pt-1 border-t border-[var(--neutral-200)]' : ''}>
              <span className="text-[var(--neutral-600)]">Public profile: </span>
              <Link href={publicUrl} target="_blank" rel="noopener noreferrer" className="lms-link font-medium">
                View portfolio
              </Link>
            </div>
          )}
          {portfolio?.custom_domain && portfolio?.domain_verified_at && (
            <div className={message || (publicUrl && portfolio?.is_public) ? 'pt-1 border-t border-[var(--neutral-200)]' : ''}>
              <span className="text-[var(--neutral-600)]">Custom domain: </span>
              <a href={`https://${portfolio.custom_domain}`} target="_blank" rel="noreferrer" className="lms-link font-medium">
                {portfolio.custom_domain}
              </a>
            </div>
          )}
        </div>
      )}

      <LmsCard title="Profile details" subtitle="Slug, headline, bio, resume and visibility" icon={LmsIcons.briefcase}>
        <form onSubmit={savePortfolio} className="flex flex-col" style={PORTFOLIO_GAP_6_STYLE}>
          <div className="grid gap-6 md:grid-cols-2" style={PORTFOLIO_GAP_6_STYLE}>
            <div>
              <label className="lms-form-label block mb-1.5">Portfolio slug</label>
              <input
                type="text"
                placeholder="e.g. jane-doe"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-[var(--neutral-500)]">Your portfolio URL will be /portfolio/[slug]</p>
            </div>
            <div>
              <label className="lms-form-label block mb-1.5">Headline</label>
              <input
                type="text"
                placeholder="e.g. Data Scientist | Python & ML"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="lms-form-label block mb-1.5">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell recruiters about yourself, skills and goals..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className={`${textareaCls} min-h-[100px]`}
            />
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--lms-space-3, 0.75rem)' }}>
            <label className="lms-form-label block">Resume</label>
            <input
              type="text"
              placeholder="https://... or upload below"
              value={form.resumeUrl}
              onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
              className={inputCls}
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="lms-btn lms-btn-primary inline-flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.875rem' }}>
                <span>Upload PDF/DOC</span>
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
                  className="sr-only"
                />
              </label>
              {uploading && <span className="text-xs text-[var(--neutral-500)]">Uploading...</span>}
              {uploadMessage && <span className="text-xs text-[var(--neutral-500)]">{uploadMessage}</span>}
            </div>
          </div>

          <div>
            <label className="lms-form-label block mb-1.5">Custom domain</label>
            <input
              type="text"
              placeholder="e.g. portfolio.yourdomain.com"
              value={form.customDomain}
              onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              className={inputCls}
            />
            {domainStatus && (
              <p className="mt-1 text-xs text-[var(--neutral-500)]">Domain status: {domainStatus}</p>
            )}
            {portfolio?.domain_verification_token && form.customDomain && (
              <div className="mt-2 p-3 rounded-lg text-xs space-y-1 bg-[var(--neutral-100)] text-[var(--neutral-600)]">
                <p>Verify by adding a CNAME record, then visit:</p>
                <p className="break-all font-mono">https://{form.customDomain}/api/portfolio/verify-domain?token={portfolio.domain_verification_token}</p>
              </div>
            )}
          </div>

          <label className="lms-toggle">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
            />
            <span className="lms-toggle-track" />
            <span className="text-sm font-medium text-[var(--neutral-700)]">Make portfolio public</span>
          </label>

          <div className="pt-4">
            <button type="submit" className="lms-btn lms-btn-primary">
              Save profile
            </button>
          </div>
        </form>
      </LmsCard>

      <LmsCard title="Projects" subtitle="Showcase work with title, description, link and image" icon={LmsIcons.book}>
        <form onSubmit={saveProject} className="flex flex-col gap-4 pb-6 mb-6 border-b border-[var(--neutral-200)]">
          <div className="grid gap-6 md:grid-cols-2">
            <input
              type="text"
              placeholder="Project title"
              value={projectForm.title}
              onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Project URL"
              value={projectForm.linkUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className={inputCls}
            />
          </div>
          <textarea
            rows={2}
            placeholder="Short description"
            value={projectForm.description}
            onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
            className={`${textareaCls}`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Image URL"
              value={projectForm.imageUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className={`${inputCls} flex-1 min-w-0 max-w-md`}
            />
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--neutral-200)] cursor-pointer text-sm hover:bg-white transition-colors">
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
                className="sr-only"
              />
              <span className="text-[var(--neutral-700)]">Upload image</span>
            </label>
            {uploading && <span className="text-xs text-[var(--neutral-500)]">Uploading...</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="lms-btn lms-btn-primary">
              {editingProjectId ? 'Update project' : 'Add project'}
            </button>
            {editingProjectId && (
              <button type="button" onClick={() => { setEditingProjectId(null); setProjectForm(emptyProjectForm); }} className="lms-btn lms-btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>

        {projects.length === 0 ? (
          <div className="text-center pt-6 pb-4 text-[var(--neutral-600)]">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 bg-[var(--neutral-100)] text-[var(--neutral-400)]">
              {LmsIcons.book}
            </div>
            <p className="text-sm font-medium text-[var(--neutral-600)]">No projects yet</p>
            <p className="text-xs mt-1 text-[var(--neutral-500)]">Add a project above to showcase your work.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" style={PORTFOLIO_GRID_GAP_STYLE}>
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-[var(--neutral-200)] overflow-hidden transition-shadow hover:shadow-md">
                {project.image_url && (
                  <div className="aspect-video bg-[var(--neutral-100)] relative">
                    <img src={project.image_url} alt={project.title || 'Project image'} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--neutral-900)]" style={{ fontSize: 'var(--lms-title-sm)' }}>{project.title}</h3>
                  {project.description && (
                    <p className="text-sm mt-1 line-clamp-2 text-[var(--neutral-500)]">{project.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {project.link_url && (
                      <a href={project.link_url} target="_blank" rel="noreferrer" className="lms-link text-sm font-medium truncate">
                        View project
                      </a>
                    )}
                    <div className="flex gap-2 flex-shrink-0">
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
                        className="lms-btn lms-btn-sm lms-btn-secondary"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteProject(project.id)} className="lms-btn lms-btn-sm lms-btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </LmsCard>

      <LmsCard title="Social links" subtitle="LinkedIn, GitHub, Twitter, etc." icon={LmsIcons.chat}>
        <form onSubmit={saveLink} className="flex flex-col gap-4 pb-6 mb-6 border-b border-[var(--neutral-200)]">
          <div className="grid gap-6 md:grid-cols-2">
            <input
              type="text"
              placeholder="Platform (e.g. LinkedIn, GitHub)"
              value={linkForm.platform}
              onChange={(e) => setLinkForm((f) => ({ ...f, platform: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="https://..."
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="lms-btn lms-btn-primary">
              {editingLinkId ? 'Update link' : 'Add link'}
            </button>
            {editingLinkId && (
              <button type="button" onClick={() => { setEditingLinkId(null); setLinkForm(emptyLinkForm); }} className="lms-btn lms-btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>

        {links.length === 0 ? (
          <p className="text-sm text-center text-[var(--neutral-500)] pt-8 pb-4">No social links added.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--neutral-200)]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-[var(--neutral-900)]">{link.platform}</p>
                  <a href={link.url} target="_blank" rel="noreferrer" className="lms-link text-sm truncate block">
                    {link.url}
                  </a>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditingLinkId(link.id); setLinkForm({ platform: link.platform || '', url: link.url || '' }); }}
                    className="lms-btn lms-btn-sm lms-btn-secondary"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteLink(link.id)} className="lms-btn lms-btn-sm lms-btn-danger">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </LmsCard>
    </div>
  );
}
