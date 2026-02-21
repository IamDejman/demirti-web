'use client';

import { formatTimeLagos, formatDateLagos } from '@/lib/dateUtils';

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
  return (
    <>
      <div className="admin-card">
        <h2 className="admin-card-title">Weeks and content</h2>
        {lmsMessage && <p className="admin-form-hint" style={{ marginBottom: '1rem', color: lmsMessage.includes('created') || lmsMessage.includes('added') || lmsMessage.includes('updated') ? '#059669' : 'inherit' }}>{lmsMessage}</p>}

        <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="admin-cohort-section-card">
            <h3 className="admin-card-title">Create week</h3>
            <form onSubmit={handleCreateWeek} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Week number</label>
                <input type="number" placeholder="e.g. 1" value={weekForm.weekNumber} onChange={(e) => setWeekForm((f) => ({ ...f, weekNumber: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Week title</label>
                <input type="text" placeholder="e.g. Introduction" value={weekForm.title} onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Description (optional)</label>
                <textarea placeholder="Brief description of the week" value={weekForm.description} onChange={(e) => setWeekForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Week start (Saturday)</label>
                <input type="date" value={weekForm.weekStartDate} onChange={(e) => setWeekForm((f) => ({ ...f, weekStartDate: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Week end (Friday)</label>
                <input type="date" value={weekForm.weekEndDate} onChange={(e) => setWeekForm((f) => ({ ...f, weekEndDate: e.target.value }))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Unlock date & time (optional)</label>
                <input type="datetime-local" value={weekForm.unlockDate} onChange={(e) => setWeekForm((f) => ({ ...f, unlockDate: e.target.value }))} title="When week content becomes visible; can differ from week start" />
              </div>
              <p className="admin-form-hint" style={{ margin: 0, fontSize: '0.8125rem' }}>
                Add 2–3 live classes for this week in the <strong>Live classes</strong> section below (each with its own date/time and meeting link).
              </p>
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!weekForm.isLocked} onChange={(e) => setWeekForm((f) => ({ ...f, isLocked: !e.target.checked }))} />
                Unlock immediately
              </label>
              <button type="submit" disabled={savingWeek} className="admin-btn admin-btn-primary">{savingWeek ? 'Saving...' : 'Create week'}</button>
            </form>
          </div>

          <div className="admin-cohort-section-card">
            <h3 className="admin-card-title">Select week</h3>
            <div className="admin-form-field">
              <select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
              >
                <option value="">Select a week</option>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    Week {w.week_number} · {w.title}
                  </option>
                ))}
              </select>
            </div>

            {weekDetails && (
              <div className="admin-form-hint" style={{ marginTop: '1rem' }}>
                <p><strong>Title:</strong> {weekDetails.week.title}</p>
                <p><strong>Week:</strong> {weekDetails.week.week_start_date && weekDetails.week.week_end_date
                  ? `${formatDateLagos(weekDetails.week.week_start_date)} – ${formatDateLagos(weekDetails.week.week_end_date)}`
                  : '—'}
                </p>
                <p><strong>Unlock:</strong> {weekDetails.week.unlock_date ? formatTimeLagos(weekDetails.week.unlock_date) : '—'}</p>
              </div>
            )}
          </div>
        </div>

        {selectedWeekId && (
          <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="admin-cohort-section-card">
              <h3 className="admin-card-title">Add content item</h3>
              <form onSubmit={handleCreateContent} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                <div className="admin-form-field"><input type="number" placeholder="Order index" value={contentForm.orderIndex} onChange={(e) => setContentForm((f) => ({ ...f, orderIndex: e.target.value }))} /></div>
                <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={contentForm.isDownloadable} onChange={(e) => setContentForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                  Downloadable
                </label>
                <button type="submit" disabled={savingContent} className="admin-btn admin-btn-primary">{savingContent ? 'Saving...' : editingContentId ? 'Update content' : 'Add content'}</button>
              </form>
            </div>

            <div className="admin-cohort-section-card">
              <h3 className="admin-card-title">Add material</h3>
              <form onSubmit={handleCreateMaterial} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
            </div>

            <div className="admin-cohort-section-card">
              <h3 className="admin-card-title">Add assignment</h3>
              <form onSubmit={handleCreateAssignment} className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                <div className="admin-form-field">
                  <input type="text" placeholder="Title (required)" value={assignmentForm.title} onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <textarea placeholder="Description (optional)" value={assignmentForm.description} onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="admin-form-field">
                  <input type="datetime-local" placeholder="Deadline" value={assignmentForm.deadlineAt} onChange={(e) => setAssignmentForm((f) => ({ ...f, deadlineAt: e.target.value }))} />
                </div>
                <div className="admin-form-field">
                  <select value={assignmentForm.submissionType} onChange={(e) => setAssignmentForm((f) => ({ ...f, submissionType: e.target.value }))}>
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="file_upload">File upload</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
                <div className="admin-form-field">
                  <input type="number" placeholder="Max score" min={0} value={assignmentForm.maxScore} onChange={(e) => setAssignmentForm((f) => ({ ...f, maxScore: e.target.value }))} />
                </div>
                <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={assignmentForm.isPublished} onChange={(e) => setAssignmentForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                  Publish immediately (notify students)
                </label>
                <button type="submit" disabled={savingAssignment} className="admin-btn admin-btn-primary">{savingAssignment ? 'Creating...' : 'Add assignment'}</button>
              </form>
            </div>
          </div>
        )}

        {selectedWeekId && weekDetails && (
          <div className="admin-cohort-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div>
              <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Current content</h3>
              {weekDetails.contentItems?.length ? (
                <ul className="admin-cohort-item-list">
                  {weekDetails.contentItems.map((item) => (
                    <li key={item.id} className="admin-cohort-item-row">
                      <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{item.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleEditContent(item)} className="admin-btn admin-btn-ghost admin-btn-sm">Edit</button>
                        <button type="button" onClick={() => handleDeleteContent(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-form-hint">No content items yet.</p>
              )}
            </div>
            <div>
              <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Current materials</h3>
              {weekDetails.materials?.length ? (
                <ul className="admin-cohort-item-list">
                  {weekDetails.materials.map((item) => (
                    <li key={item.id} className="admin-cohort-item-row">
                      <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{item.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleEditMaterial(item)} className="admin-btn admin-btn-ghost admin-btn-sm">Edit</button>
                        <button type="button" onClick={() => handleDeleteMaterial(item.id)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: '#dc3545' }}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-form-hint">No materials yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Live classes</h2>
        <form onSubmit={handleCreateLiveClass} className="admin-form-group admin-action-group admin-cohort-live-form">
          <div className="admin-form-field">
            <select value={liveClassForm.weekId} onChange={(e) => setLiveClassForm((f) => ({ ...f, weekId: e.target.value }))}>
              <option value="">Select week</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-field">
            <input type="datetime-local" value={liveClassForm.scheduledAt} onChange={(e) => setLiveClassForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="admin-form-field">
            <input type="text" placeholder="Google Meet link" value={liveClassForm.googleMeetLink} onChange={(e) => setLiveClassForm((f) => ({ ...f, googleMeetLink: e.target.value }))} />
          </div>
          <button type="submit" disabled={savingLiveClass} className="admin-btn admin-btn-primary admin-cohort-live-submit">
            {savingLiveClass ? 'Scheduling...' : 'Schedule live class'}
          </button>
        </form>

        {liveClasses.length === 0 ? (
          <p className="admin-form-hint" style={{ marginTop: '1rem' }}>No live classes scheduled yet.</p>
        ) : (
          <div className="admin-cohort-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-th">Week</th>
                  <th className="admin-table-th">Scheduled</th>
                  <th className="admin-table-th">Meet link</th>
                </tr>
              </thead>
              <tbody>
                {liveClasses.map((lc) => (
                  <tr key={lc.id} className="admin-table-tr">
                    <td className="admin-table-td" style={{ fontWeight: 500 }}>{lc.week_title || lc.week_number}</td>
                    <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{lc.scheduled_at ? formatTimeLagos(lc.scheduled_at) : '—'}</td>
                    <td className="admin-table-td" style={{ color: 'var(--text-light)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lc.google_meet_link || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
