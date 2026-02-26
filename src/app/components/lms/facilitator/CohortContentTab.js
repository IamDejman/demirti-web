'use client';

import { useState, useEffect, useCallback } from 'react';
import { LmsCard, LmsEmptyState, LmsBadge } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import FileUploadButton from '@/app/components/lms/FileUploadButton';
import { getLmsAuthHeaders } from '@/lib/authClient';

const CONTENT_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'slides', label: 'Slides' },
  { value: 'video_embed', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'Link' },
  { value: 'recording', label: 'Recording' },
];

const MATERIAL_TYPES = [
  { value: 'book', label: 'Book' },
  { value: 'software', label: 'Software' },
  { value: 'starter_file', label: 'Starter file' },
  { value: 'resource', label: 'Resource' },
];

const ALL_TYPES = [...CONTENT_TYPES, ...MATERIAL_TYPES];

const EMPTY_FORM = {
  category: 'content',
  type: 'pdf',
  title: '',
  description: '',
  fileUrl: '',
  externalUrl: '',
  url: '',
  orderIndex: 0,
  isDownloadable: false,
};

export default function CohortContentTab({ cohortId, weeks }) {
  const [weekId, setWeekId] = useState('');
  const [weekContent, setWeekContent] = useState([]);
  const [weekMaterials, setWeekMaterials] = useState([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { id, kind: 'content'|'material' }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const hasWeeks = weeks.length > 0;
  const totalItems = weekContent.length + weekMaterials.length;

  const isSuccess = (msg) => {
    if (!msg) return false;
    const l = msg.toLowerCase();
    return l.includes('success') || l.includes('created') || l.includes('added') || l.includes('updated') || l.includes('deleted');
  };

  /* ── load week details ── */
  const loadWeekDetails = useCallback(async (wId) => {
    if (!wId) {
      setWeekContent([]);
      setWeekMaterials([]);
      return;
    }
    setLoadingWeek(true);
    try {
      const res = await fetch(`/api/weeks/${wId}`, { headers: getLmsAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        setWeekContent(data.contentItems || []);
        setWeekMaterials(data.materials || []);
      }
    } catch {
      /* keep existing */
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  useEffect(() => {
    loadWeekDetails(weekId);
  }, [weekId, loadWeekDetails]);

  const reloadWeek = () => loadWeekDetails(weekId);

  /* ── handle category toggle ── */
  const handleCategoryChange = (cat) => {
    setForm((f) => ({
      ...f,
      category: cat,
      type: cat === 'content' ? 'pdf' : 'book',
    }));
  };

  /* ── unified create ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!weekId) { setMessage('Please select a week first.'); return; }
    if (!form.title.trim()) { setMessage('Title is required.'); return; }

    setSaving(true);
    try {
      let res;
      if (form.category === 'content') {
        res = await fetch(`/api/weeks/${weekId}/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
          body: JSON.stringify({
            type: form.type,
            title: form.title.trim(),
            description: form.description.trim() || null,
            fileUrl: form.fileUrl.trim() || null,
            externalUrl: form.externalUrl.trim() || null,
            orderIndex: Number(form.orderIndex) || 0,
            isDownloadable: form.isDownloadable,
          }),
        });
      } else {
        res = await fetch(`/api/weeks/${weekId}/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
          body: JSON.stringify({
            type: form.type,
            title: form.title.trim(),
            description: form.description.trim() || null,
            url: form.url.trim() || null,
            fileUrl: form.fileUrl.trim() || null,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || 'Failed to add item.'); return; }
      setMessage(`${form.category === 'content' ? 'Content' : 'Material'} added!`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await reloadWeek();
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── start editing ── */
  const handleStartEdit = (item, kind) => {
    setEditingItem({ id: item.id, kind });
    setForm({
      category: kind,
      type: item.type || (kind === 'content' ? 'pdf' : 'book'),
      title: item.title || '',
      description: item.description || '',
      fileUrl: item.file_url || '',
      externalUrl: item.external_url || '',
      url: item.url || '',
      orderIndex: item.order_index ?? 0,
      isDownloadable: item.is_downloadable ?? false,
    });
    setShowForm(true);
  };

  /* ── save edit ── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setMessage('');
    if (!form.title.trim()) { setMessage('Title is required.'); return; }

    setSaving(true);
    try {
      const endpoint = editingItem.kind === 'content'
        ? `/api/content/${editingItem.id}`
        : `/api/materials/${editingItem.id}`;

      const body = editingItem.kind === 'content'
        ? {
            title: form.title.trim(),
            description: form.description.trim() || null,
            fileUrl: form.fileUrl.trim() || null,
            externalUrl: form.externalUrl.trim() || null,
            orderIndex: Number(form.orderIndex) || 0,
            isDownloadable: form.isDownloadable,
          }
        : {
            title: form.title.trim(),
            description: form.description.trim() || null,
            url: form.url.trim() || null,
            fileUrl: form.fileUrl.trim() || null,
            type: form.type,
          };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to update item.');
        return;
      }
      setMessage('Item updated successfully!');
      setEditingItem(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await reloadWeek();
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── cancel editing ── */
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  /* ── delete ── */
  const handleDeleteContent = async (contentId) => {
    if (!confirm('Delete this content item?')) return;
    try {
      const res = await fetch(`/api/content/${contentId}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
      if (res.ok) await reloadWeek();
    } catch { /* silent */ }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Delete this material?')) return;
    try {
      const res = await fetch(`/api/materials/${materialId}`, { method: 'DELETE', headers: getLmsAuthHeaders() });
      if (res.ok) await reloadWeek();
    } catch { /* silent */ }
  };

  /* ── bulk upload via JSON file ── */
  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!weekId) { setMessage('Please select a week first.'); return; }

    setMessage('');
    setSaving(true);
    try {
      const text = await file.text();
      let items;
      if (file.name.endsWith('.csv')) {
        // Parse CSV: first row is headers, subsequent rows are data
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        items = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });
      } else {
        items = JSON.parse(text);
        if (!Array.isArray(items)) items = items.items || [items];
      }

      const res = await fetch(`/api/weeks/${weekId}/bulk-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Bulk upload complete: ${data.created} item${data.created !== 1 ? 's' : ''} created.${data.errors?.length ? ` ${data.errors.length} error(s).` : ''}`);
        await reloadWeek();
        setTimeout(() => setMessage(''), 6000);
      } else {
        setMessage(data.error || 'Bulk upload failed.');
      }
    } catch {
      setMessage('Failed to parse file. Use JSON or CSV format.');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = form.category === 'content' ? CONTENT_TYPES : MATERIAL_TYPES;

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      {/* Week selector */}
      {hasWeeks ? (
        <div className="lms-field">
          <label className="lms-field-label">Select week to manage content</label>
          <select
            value={weekId}
            onChange={(e) => { setWeekId(e.target.value); setShowForm(false); }}
            className="lms-input"
            style={{ maxWidth: '24rem' }}
          >
            <option value="">Choose a week...</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>Week {w.week_number} &middot; {w.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="lms-warning-banner">
          Weeks must be configured by an admin before you can upload content.
        </p>
      )}

      {/* ── Single unified card ── */}
      <LmsCard
        title="Week content"
        subtitle={weekId ? `${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'Select a week'}
        icon={LmsIcons.book || LmsIcons.clipboard}
        hoverable={false}
        action={
          hasWeeks && weekId && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label className="lms-btn lms-btn-sm lms-btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                Bulk Upload
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleBulkUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  if (showForm) { handleCancelForm(); } else { setEditingItem(null); setForm(EMPTY_FORM); setShowForm(true); }
                }}
                className={`lms-btn lms-btn-sm ${showForm ? 'lms-btn-secondary' : 'lms-btn-primary'}`}
              >
                {showForm ? 'Cancel' : '+ Add'}
              </button>
            </div>
          )
        }
      >
        {/* Unified create form */}
        {showForm && weekId && (
          <div className="lms-form-section">
            <h4 className="lms-form-section-title">{editingItem ? 'Edit item' : 'Add item'}</h4>

            {message && (
              <p className={`lms-form-message ${isSuccess(message) ? 'lms-form-message-success' : 'lms-form-message-error'}`}>
                {message}
              </p>
            )}

            {/* Category toggle (disabled when editing) */}
            {!editingItem && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--lms-space-4)' }}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('content')}
                  className={`lms-btn lms-btn-sm ${form.category === 'content' ? 'lms-btn-primary' : 'lms-btn-outline'}`}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('material')}
                  className={`lms-btn lms-btn-sm ${form.category === 'material' ? 'lms-btn-primary' : 'lms-btn-outline'}`}
                >
                  Material
                </button>
              </div>
            )}
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', marginBottom: 'var(--lms-space-4)' }}>
              {form.category === 'content'
                ? 'Lesson content students consume each week (slides, videos, PDFs, links).'
                : 'Supplementary resources (textbooks, software, starter files).'}
            </p>

            <form onSubmit={editingItem ? handleUpdate : handleCreate} className="lms-form-stack">
              <div className="lms-field">
                <label className="lms-field-label">Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="lms-input">
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Title *</label>
                <input
                  type="text"
                  placeholder={form.category === 'content' ? 'e.g. Introduction to React' : 'e.g. JavaScript Textbook'}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="lms-input"
                />
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Description (optional)</label>
                <textarea
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="lms-input"
                />
              </div>

              <div className="lms-field">
                <label className="lms-field-label">Upload file {form.category === 'material' ? '(optional)' : ''}</label>
                <FileUploadButton
                  accept=".pdf,.doc,.docx,.pptx,.png,.jpg,.jpeg,.gif,.mp4,.zip"
                  onUploaded={(url) => setForm((f) => ({ ...f, fileUrl: url }))}
                />
                {form.fileUrl && (
                  <p className="lms-file-success" style={{ wordBreak: 'break-all' }}>File: {form.fileUrl}</p>
                )}
              </div>

              {form.category === 'content' && (
                <div className="lms-field">
                  <label className="lms-field-label">External URL (optional, for links / video embeds)</label>
                  <input type="url" placeholder="https://..." value={form.externalUrl} onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))} className="lms-input" />
                </div>
              )}

              {form.category === 'material' && (
                <div className="lms-field">
                  <label className="lms-field-label">URL (optional, for external links)</label>
                  <input type="url" placeholder="https://..." value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className="lms-input" />
                </div>
              )}

              {form.category === 'content' && (
                <div className="lms-form-grid">
                  <div className="lms-field">
                    <label className="lms-field-label">Order index</label>
                    <input type="number" min={0} value={form.orderIndex} onChange={(e) => setForm((f) => ({ ...f, orderIndex: e.target.value }))} className="lms-input lms-input-narrow" />
                  </div>
                  <label className="lms-checkbox-label" style={{ alignSelf: 'end' }}>
                    <input type="checkbox" checked={form.isDownloadable} onChange={(e) => setForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                    Downloadable
                  </label>
                </div>
              )}

              <div>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : `Add ${form.category === 'content' ? 'Content' : 'Material'}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success message when form is hidden */}
        {!showForm && message && (
          <p className={`lms-form-message ${isSuccess(message) ? 'lms-form-message-success' : 'lms-form-message-error'}`}>
            {message}
          </p>
        )}

        {/* Combined items list */}
        {weekId && !loadingWeek && (
          <>
            {totalItems === 0 ? (
              <LmsEmptyState
                icon={LmsIcons.book || LmsIcons.clipboard}
                title="No content yet"
                description='Click "+ Add" to upload slides, videos, PDFs, books or resources.'
              />
            ) : (
              <div>
                {/* Content items */}
                {weekContent.map((item) => (
                  <div key={`c-${item.id}`} className="lms-list-item">
                    <div className="lms-list-item-info">
                      <span className="lms-list-item-title">{item.title}</span>
                      <LmsBadge variant="info">{ALL_TYPES.find((t) => t.value === item.type)?.label || item.type}</LmsBadge>
                      {item.file_url && <span className="lms-list-item-meta">has file</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => handleStartEdit(item, 'content')} className="lms-btn lms-btn-sm lms-btn-outline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteContent(item.id)} className="lms-btn-delete-text">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Materials — with a subtle separator if both exist */}
                {weekContent.length > 0 && weekMaterials.length > 0 && (
                  <div style={{ borderTop: '1px dashed var(--neutral-200)', margin: 'var(--lms-space-3) 0' }} />
                )}

                {weekMaterials.map((item) => (
                  <div key={`m-${item.id}`} className="lms-list-item">
                    <div className="lms-list-item-info">
                      <span className="lms-list-item-title">{item.title}</span>
                      <LmsBadge variant="neutral">{ALL_TYPES.find((t) => t.value === item.type)?.label || item.type}</LmsBadge>
                      {item.file_url && <span className="lms-list-item-meta">has file</span>}
                      {item.url && <span className="lms-list-item-meta">has link</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => handleStartEdit(item, 'material')} className="lms-btn lms-btn-sm lms-btn-outline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteMaterial(item.id)} className="lms-btn-delete-text">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {weekId && loadingWeek && <div className="h-16 lms-skeleton rounded-lg" />}

        {!weekId && hasWeeks && (
          <p className="lms-row-item-detail">Select a week above to manage content.</p>
        )}
      </LmsCard>
    </div>
  );
}
