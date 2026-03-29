'use client';

import { formatTimeLagos, formatDateLagos } from '@/lib/dateUtils';

function isSuccessFeedback(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.includes('failed') || lower.includes('error') || lower.includes('wrong') || lower.includes('select ')) {
    return false;
  }
  return (
    lower.includes('success') ||
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('added') ||
    lower.includes('scheduled') ||
    lower.includes('assigned') ||
    lower.includes('removed') ||
    lower.includes('enrolled') ||
    lower.includes('resent') ||
    lower.includes('deleted')
  );
}

function SectionCard({ icon, iconBg, title, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          background: iconBg || 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem',
        }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-color)' }}>{title}</h3>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}

export default function CohortAssignments({
  weeks,
  selectedWeekId,
  setSelectedWeekId,
  weekDetails,
  weekForm,
  setWeekForm,
  contentForm,
  setContentForm,
  editingContentId,
  setEditingContentId: _setEditingContentId,
  materialForm,
  setMaterialForm,
  editingMaterialId,
  setEditingMaterialId: _setEditingMaterialId,
  liveClassForm,
  setLiveClassForm,
  liveClasses,
  handleDeleteLiveClass,
  handleEditLiveClass,
  handleCancelEditLiveClass,
  editingLiveClassId,
  assignmentForm,
  setAssignmentForm,
  savingAssignment,
  handleCreateAssignment,
  lmsMessage,
  savingWeek,
  savingContent,
  savingMaterial,
  savingLiveClass,
  handleCreateWeek,
  handleCreateContent,
  handleCreateMaterial,
  handleEditContent,
  handleDeleteContent,
  handleEditMaterial,
  handleDeleteMaterial,
  handleCreateLiveClass,
}) {
  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.375rem' };
  const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.75rem' };

  return (
    <>
      {isSuccessFeedback(lmsMessage) && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 8,
          background: 'rgba(5, 150, 105, 0.08)',
          border: '1px solid rgba(5, 150, 105, 0.2)',
          color: '#059669',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '1rem',
        }}>
          {lmsMessage}
        </div>
      )}

      {/* Week management row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SectionCard icon="+" iconBg="linear-gradient(135deg, #ecfdf5, #d1fae5)" title="Create week">
          <form onSubmit={handleCreateWeek} style={formGroupStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field" style={formFieldStyle}>
                <label className="admin-form-label">Week #</label>
                <input type="number" placeholder="1" value={weekForm.weekNumber} onChange={(e) => setWeekForm((f) => ({ ...f, weekNumber: e.target.value }))} />
              </div>
              <div className="admin-form-field" style={formFieldStyle}>
                <label className="admin-form-label">Title</label>
                <input type="text" placeholder="e.g. Introduction" value={weekForm.title} onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-field" style={formFieldStyle}>
              <label className="admin-form-label">Description (optional)</label>
              <textarea placeholder="Brief description" value={weekForm.description} onChange={(e) => setWeekForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-form-field" style={formFieldStyle}>
                <label className="admin-form-label">Start (Sat)</label>
                <input type="date" value={weekForm.weekStartDate} onChange={(e) => setWeekForm((f) => ({ ...f, weekStartDate: e.target.value }))} />
              </div>
              <div className="admin-form-field" style={formFieldStyle}>
                <label className="admin-form-label">End (Fri)</label>
                <input type="date" value={weekForm.weekEndDate} onChange={(e) => setWeekForm((f) => ({ ...f, weekEndDate: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-field" style={formFieldStyle}>
              <label className="admin-form-label">Unlock date (optional)</label>
              <input type="datetime-local" value={weekForm.unlockDate} onChange={(e) => setWeekForm((f) => ({ ...f, unlockDate: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={!weekForm.isLocked} onChange={(e) => setWeekForm((f) => ({ ...f, isLocked: !e.target.checked }))} />
              Unlock immediately
            </label>
            <button type="submit" disabled={savingWeek} className="admin-btn admin-btn-primary">{savingWeek ? 'Saving...' : 'Create week'}</button>
          </form>
        </SectionCard>

        <SectionCard icon="📅" iconBg="linear-gradient(135deg, #eff6ff, #dbeafe)" title="Weeks overview">
          <div className="admin-form-field" style={{ marginBottom: '1rem' }}>
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select a week to manage</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.week_number} · {w.title} {w.is_locked ? '🔒' : '🔓'}
                </option>
              ))}
            </select>
          </div>

          {weeks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)' }}>
              <p style={{ fontSize: '0.875rem' }}>No weeks created yet. Use the form to create your first week.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {weeks.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWeekId(w.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedWeekId === w.id ? 'rgba(0, 82, 163, 0.06)' : 'transparent',
                    border: selectedWeekId === w.id ? '1px solid rgba(0, 82, 163, 0.15)' : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: w.is_locked ? '#f3f4f6' : 'linear-gradient(135deg, #0052a3, #3b82f6)',
                    color: w.is_locked ? '#9ca3af' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {w.week_number}
                  </span>
                  <span style={{
                    flex: 1, fontSize: '0.875rem', fontWeight: 500,
                    color: w.is_locked ? 'var(--text-light)' : 'var(--text-color)',
                  }}>
                    {w.title}
                  </span>
                  <span style={{ fontSize: '0.75rem' }}>{w.is_locked ? '🔒' : '🔓'}</span>
                </div>
              ))}
            </div>
          )}

          {weekDetails && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 6, background: '#f9fafb', fontSize: '0.8125rem', color: 'var(--text-light)' }}>
              <p style={{ margin: '0 0 0.25rem' }}><strong>Period:</strong> {weekDetails.week.week_start_date && weekDetails.week.week_end_date
                ? `${formatDateLagos(weekDetails.week.week_start_date)} – ${formatDateLagos(weekDetails.week.week_end_date)}`
                : '—'}
              </p>
              <p style={{ margin: 0 }}><strong>Unlock:</strong> {weekDetails.week.unlock_date ? formatTimeLagos(weekDetails.week.unlock_date) : '—'}</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Content/material/assignment forms — shown when a week is selected */}
      {selectedWeekId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <SectionCard icon="📄" iconBg="linear-gradient(135deg, #fef3c7, #fde68a)" title="Add content">
            <form onSubmit={handleCreateContent} style={formGroupStyle}>
              <div className="admin-form-field">
                <select value={contentForm.type} onChange={(e) => setContentForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="pdf">PDF</option>
                  <option value="slides">Slides</option>
                  <option value="video_embed">Video</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                  <option value="recording">Recording</option>
                </select>
              </div>
              <div className="admin-form-field"><input type="text" placeholder="Title" value={contentForm.title} onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="admin-form-field"><textarea placeholder="Description (optional)" value={contentForm.description} onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="admin-form-field"><input type="text" placeholder="File URL (optional)" value={contentForm.fileUrl} onChange={(e) => setContentForm((f) => ({ ...f, fileUrl: e.target.value }))} /></div>
              <div className="admin-form-field"><input type="text" placeholder="External URL (optional)" value={contentForm.externalUrl} onChange={(e) => setContentForm((f) => ({ ...f, externalUrl: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                <div className="admin-form-field"><input type="number" placeholder="Order" value={contentForm.orderIndex} onChange={(e) => setContentForm((f) => ({ ...f, orderIndex: e.target.value }))} /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={contentForm.isDownloadable} onChange={(e) => setContentForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                  Downloadable
                </label>
              </div>
              <button type="submit" disabled={savingContent} className="admin-btn admin-btn-primary">{savingContent ? 'Saving...' : editingContentId ? 'Update content' : 'Add content'}</button>
            </form>
          </SectionCard>

          <SectionCard icon="📦" iconBg="linear-gradient(135deg, #f0f9ff, #bae6fd)" title="Add material">
            <form onSubmit={handleCreateMaterial} style={formGroupStyle}>
              <div className="admin-form-field">
                <select value={materialForm.type} onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="book">Book</option>
                  <option value="software">Software</option>
                  <option value="starter_file">Starter file</option>
                  <option value="resource">Resource</option>
                </select>
              </div>
              <div className="admin-form-field"><input type="text" placeholder="Title" value={materialForm.title} onChange={(e) => setMaterialForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="admin-form-field"><textarea placeholder="Description (optional)" value={materialForm.description} onChange={(e) => setMaterialForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="admin-form-field"><input type="text" placeholder="URL (optional)" value={materialForm.url} onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))} /></div>
              <div className="admin-form-field"><input type="text" placeholder="File URL (optional)" value={materialForm.fileUrl} onChange={(e) => setMaterialForm((f) => ({ ...f, fileUrl: e.target.value }))} /></div>
              <button type="submit" disabled={savingMaterial} className="admin-btn admin-btn-primary">{savingMaterial ? 'Saving...' : editingMaterialId ? 'Update material' : 'Add material'}</button>
            </form>
          </SectionCard>

          <SectionCard icon="📝" iconBg="linear-gradient(135deg, #fdf2f8, #fce7f3)" title="Add assignment">
            <form onSubmit={handleCreateAssignment} style={formGroupStyle}>
              <div className="admin-form-field">
                <select
                  value={assignmentForm.weekId}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, weekId: e.target.value }))}
                >
                  <option value="">Select week</option>
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field"><input type="text" placeholder="Title (required)" value={assignmentForm.title} onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="admin-form-field"><textarea placeholder="Description (optional)" value={assignmentForm.description} onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="admin-form-field"><input type="datetime-local" placeholder="Deadline" value={assignmentForm.deadlineAt} onChange={(e) => setAssignmentForm((f) => ({ ...f, deadlineAt: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="admin-form-field">
                  <select value={assignmentForm.submissionType} onChange={(e) => setAssignmentForm((f) => ({ ...f, submissionType: e.target.value }))}>
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="file_upload">File upload</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
                <div className="admin-form-field"><input type="number" placeholder="Max score" min={0} value={assignmentForm.maxScore} onChange={(e) => setAssignmentForm((f) => ({ ...f, maxScore: e.target.value }))} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={assignmentForm.isPublished} onChange={(e) => setAssignmentForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Publish immediately
              </label>
              <button type="submit" disabled={savingAssignment} className="admin-btn admin-btn-primary">{savingAssignment ? 'Creating...' : 'Add assignment'}</button>
            </form>
          </SectionCard>
        </div>
      )}

      {/* Existing content/materials list */}
      {selectedWeekId && weekDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <SectionCard icon="📄" iconBg="linear-gradient(135deg, #fef3c7, #fde68a)" title="Current content">
            {weekDetails.contentItems?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weekDetails.contentItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 6,
                    border: '1px solid #f3f4f6', background: '#fafafa',
                  }}>
                    <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</span>
                      <span style={{
                        display: 'inline-block', fontSize: '0.6875rem', fontWeight: 500,
                        marginLeft: '0.5rem', padding: '1px 6px', borderRadius: 4,
                        background: '#f3f4f6', color: '#6b7280',
                      }}>{item.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => handleEditContent(item)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ fontSize: '0.75rem' }}>Edit</button>
                      <button type="button" onClick={() => handleDeleteContent(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No content items yet.</p>
            )}
          </SectionCard>

          <SectionCard icon="📦" iconBg="linear-gradient(135deg, #f0f9ff, #bae6fd)" title="Current materials">
            {weekDetails.materials?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weekDetails.materials.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 6,
                    border: '1px solid #f3f4f6', background: '#fafafa',
                  }}>
                    <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</span>
                      <span style={{
                        display: 'inline-block', fontSize: '0.6875rem', fontWeight: 500,
                        marginLeft: '0.5rem', padding: '1px 6px', borderRadius: 4,
                        background: '#f3f4f6', color: '#6b7280',
                      }}>{item.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => handleEditMaterial(item)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ fontSize: '0.75rem' }}>Edit</button>
                      <button type="button" onClick={() => handleDeleteMaterial(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No materials yet.</p>
            )}
          </SectionCard>
        </div>
      )}

      {/* Live classes */}
      <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #fef2f2, #fecaca)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>📹</span>
          Live classes
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400, marginLeft: 'auto' }}>All times in WAT (UTC+1)</span>
        </h2>
        <form onSubmit={handleCreateLiveClass} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', background: '#f9fafb', borderRadius: 8, marginBottom: '1rem' }}>
          <div className="admin-form-field" style={{ flex: '1 1 160px' }}>
            <label className="admin-form-label">Week</label>
            <select value={liveClassForm.weekId} onChange={(e) => setLiveClassForm((f) => ({ ...f, weekId: e.target.value }))}>
              <option value="">Select week</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-field" style={{ flex: '1 1 180px' }}>
            <label className="admin-form-label">Start time (WAT)</label>
            <input type="datetime-local" value={liveClassForm.scheduledAt} onChange={(e) => setLiveClassForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="admin-form-field" style={{ flex: '1 1 180px' }}>
            <label className="admin-form-label">End time (WAT)</label>
            <input type="datetime-local" value={liveClassForm.endTime} onChange={(e) => setLiveClassForm((f) => ({ ...f, endTime: e.target.value }))} />
          </div>
          <div className="admin-form-field" style={{ flex: '2 1 200px' }}>
            <label className="admin-form-label">Google Meet link</label>
            <input type="text" placeholder="https://meet.google.com/..." value={liveClassForm.googleMeetLink} onChange={(e) => setLiveClassForm((f) => ({ ...f, googleMeetLink: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button type="submit" disabled={savingLiveClass} className="admin-btn admin-btn-primary">
              {savingLiveClass ? (editingLiveClassId ? 'Saving...' : 'Scheduling...') : (editingLiveClassId ? 'Save changes' : 'Schedule')}
            </button>
            {editingLiveClassId && (
              <button type="button" onClick={handleCancelEditLiveClass} className="admin-btn admin-btn-ghost">Cancel</button>
            )}
          </div>
        </form>

        {liveClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '0.75rem' }}>📹</div>
            <p style={{ fontSize: '0.9375rem' }}>No live classes scheduled yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {liveClasses.map((lc) => (
              <div key={lc.id} style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8125rem', flexShrink: 0,
                }}>📹</span>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-color)' }}>{lc.week_title || `Week ${lc.week_number}`}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>
                    {lc.scheduled_at ? formatTimeLagos(lc.scheduled_at) : '—'}
                    {lc.end_time ? ` – ${formatTimeLagos(lc.end_time)}` : ''}
                  </div>
                </div>
                {lc.google_meet_link && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lc.google_meet_link}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleEditLiveClass(lc)} className="admin-btn admin-btn-ghost admin-btn-sm" disabled={!!editingLiveClassId && editingLiveClassId !== lc.id} style={{ fontSize: '0.75rem' }}>Edit</button>
                  <button type="button" onClick={() => handleDeleteLiveClass(lc.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545', fontSize: '0.75rem' }} disabled={!!editingLiveClassId}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
