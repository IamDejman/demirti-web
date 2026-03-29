'use client';

const STATUS_CONFIG = {
  active: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  inactive: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
  completed: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
};

export default function CohortStudentList({ students, formatDate }) {
  return (
    <div className="admin-card" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>👥</span>
        Students ({students.length})
      </h2>
      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ fontSize: '0.9375rem' }}>No students enrolled yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {students.map((s) => {
            const status = s.status || 'active';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
            return (
              <div key={s.id} style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0052a3, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                }}>
                  {(s.first_name?.[0] || s.email?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>{s.first_name} {s.last_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{s.email}</div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  padding: '0.2rem 0.6rem', fontSize: '0.6875rem', fontWeight: 600,
                  borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: config.bg, color: config.color,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color }} />
                  {status}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', flexShrink: 0 }}>
                  Enrolled {formatDate(s.enrolled_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
