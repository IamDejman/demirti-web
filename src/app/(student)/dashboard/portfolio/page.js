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

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary';
const inputStyle = { borderColor: 'var(--neutral-200)', color: 'var(--neutral-900)' };
const labelClass = 'block text-sm font-medium mb-1.5';
const labelStyle = { color: 'var(--neutral-700)' };

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
      <div className="space-y-8">
        <div className="h-10 w-48 lms-skeleton rounded-lg" />
        <div className="h-40 lms-skeleton rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 lms-skeleton rounded-xl" />
          <div className="h-72 lms-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  const publicUrl = portfolio?.slug ? `/portfolio/${portfolio.slug}` : null;
  const domainStatus = portfolio?.domain_verified_at ? 'Verified' : portfolio?.custom_domain ? 'Pending verification' : null;

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title="Portfolio"
        subtitle="Build a public profile for recruiters and showcase your projects."
        icon={LmsIcons.briefcase}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      {(message || publicUrl || portfolio?.custom_domain) && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}
        >
          {message && (
            <p className={`text-sm font-medium ${message.includes('Failed') ? '' : ''}`} style={{ color: message.includes('Failed') ? 'var(--red-600, #dc2626)' : 'var(--primary-color)' }}>
              {message}
            </p>
          )}
          {publicUrl && portfolio?.is_public && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--neutral-600)' }}>Public profile:</span>
              <Link
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View portfolio
              </Link>
            </div>
          )}
          {portfolio?.custom_domain && portfolio?.domain_verified_at && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--neutral-600)' }}>Custom domain:</span>
              <a href={`https://${portfolio.custom_domain}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                {portfolio.custom_domain}
              </a>
            </div>
          )}
        </div>
      )}

      <LmsCard title="Profile details" subtitle="Slug, headline, bio, resume and visibility" icon={LmsIcons.briefcase}>
        <form onSubmit={savePortfolio} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>Portfolio slug</label>
              <input
                type="text"
                placeholder="e.g. jane-doe"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--neutral-500)' }}>Your portfolio URL will be /portfolio/[slug]</p>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Headline</label>
              <input
                type="text"
                placeholder="e.g. Data Scientist | Python & ML"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Bio</label>
            <textarea
              rows={4}
              placeholder="Tell recruiters about yourself, skills and goals..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className={`${inputClass} resize-y min-h-[100px]`}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Resume</label>
            <input
              type="text"
              placeholder="https://... or upload below"
              value={form.resumeUrl}
              onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--neutral-200)' }}>
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
                <span style={{ color: 'var(--neutral-700)' }}>Upload PDF/DOC</span>
              </label>
              {uploading && <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>Uploading...</span>}
              {uploadMessage && <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>{uploadMessage}</span>}
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Custom domain</label>
            <input
              type="text"
              placeholder="e.g. portfolio.yourdomain.com"
              value={form.customDomain}
              onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
            {domainStatus && (
              <p className="mt-1 text-xs" style={{ color: 'var(--neutral-500)' }}>Domain status: {domainStatus}</p>
            )}
            {portfolio?.domain_verification_token && form.customDomain && (
              <div className="mt-2 p-3 rounded-lg text-xs space-y-1" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)' }}>
                <p>Verify by adding a CNAME record, then visit:</p>
                <p className="break-all font-mono">https://{form.customDomain}/api/portfolio/verify-domain?token={portfolio.domain_verification_token}</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>Make portfolio public</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-medium text-white transition-colors hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Save profile
            </button>
          </div>
        </form>
      </LmsCard>

      <LmsCard title="Projects" subtitle="Showcase work with title, description, link and image" icon={LmsIcons.book}>
        <form onSubmit={saveProject} className="space-y-4 p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--neutral-50)', border: '1px dashed var(--neutral-200)' }}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Project title"
              value={projectForm.title}
              onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Project URL"
              value={projectForm.linkUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <textarea
            rows={2}
            placeholder="Short description"
            value={projectForm.description}
            onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
            className={`${inputClass} resize-y`}
            style={inputStyle}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Image URL"
              value={projectForm.imageUrl}
              onChange={(e) => setProjectForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className={`${inputClass} flex-1 min-w-0 max-w-md`}
              style={inputStyle}
            />
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm hover:bg-white transition-colors" style={{ borderColor: 'var(--neutral-200)' }}>
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
              <span style={{ color: 'var(--neutral-700)' }}>Upload image</span>
            </label>
            {uploading && <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>Uploading...</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {editingProjectId ? 'Update project' : 'Add project'}
            </button>
            {editingProjectId && (
              <button
                type="button"
                onClick={() => { setEditingProjectId(null); setProjectForm(emptyProjectForm); }}
                className="px-4 py-2.5 rounded-lg font-medium border"
                style={{ borderColor: 'var(--neutral-300)', color: 'var(--neutral-700)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {projects.length === 0 ? (
          <div className="text-center py-10 rounded-xl" style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-100)' }}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.15 }}>
              {LmsIcons.book}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--neutral-600)' }}>No projects yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--neutral-500)' }}>Add a project above to showcase your work.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
                style={{ borderColor: 'var(--neutral-200)' }}
              >
                {project.image_url && (
                  <div className="aspect-video bg-gray-100 relative">
                    <img src={project.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold" style={{ color: 'var(--neutral-900)', fontSize: 'var(--lms-title-sm)' }}>{project.title}</h3>
                  {project.description && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--neutral-500)' }}>{project.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {project.link_url && (
                      <a href={project.link_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
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
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50"
                        style={{ borderColor: 'var(--neutral-300)', color: 'var(--neutral-700)' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(project.id)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50"
                        style={{ borderColor: 'var(--neutral-300)', color: 'var(--red-600, #dc2626)' }}
                      >
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
        <form onSubmit={saveLink} className="space-y-4 p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--neutral-50)', border: '1px dashed var(--neutral-200)' }}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Platform (e.g. LinkedIn, GitHub)"
              value={linkForm.platform}
              onChange={(e) => setLinkForm((f) => ({ ...f, platform: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="https://..."
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {editingLinkId ? 'Update link' : 'Add link'}
            </button>
            {editingLinkId && (
              <button
                type="button"
                onClick={() => { setEditingLinkId(null); setLinkForm(emptyLinkForm); }}
                className="px-4 py-2.5 rounded-lg font-medium border"
                style={{ borderColor: 'var(--neutral-300)', color: 'var(--neutral-700)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {links.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-100)' }}>
            <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>No social links added.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                style={{ borderColor: 'var(--neutral-200)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate" style={{ color: 'var(--neutral-900)' }}>{link.platform}</p>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-sm truncate block text-primary hover:underline">
                    {link.url}
                  </a>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditingLinkId(link.id); setLinkForm({ platform: link.platform || '', url: link.url || '' }); }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50"
                    style={{ borderColor: 'var(--neutral-300)', color: 'var(--neutral-700)' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLink(link.id)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50"
                    style={{ borderColor: 'var(--neutral-300)', color: 'var(--red-600, #dc2626)' }}
                  >
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
