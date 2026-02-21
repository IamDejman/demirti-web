'use client';

const statusColors = { upcoming: '#6b7280', active: '#059669', completed: '#2563eb' };

function StatusBadge({ status }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 6,
        textTransform: 'capitalize',
        backgroundColor: `${statusColors[status] || '#6b7280'}20`,
        color: statusColors[status] || '#6b7280',
      }}
    >
      {status}
    </span>
  );
}

export default function CohortStudentList({ students, formatDate }) {
  return (
    <div className="admin-card">
      <h2 className="admin-card-title">Students ({students.length})</h2>
      {students.length === 0 ? (
        <p className="admin-form-hint">No students enrolled yet.</p>
      ) : (
        <div className="admin-cohort-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-table-th">Name</th>
                <th className="admin-table-th">Email</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="admin-table-tr">
                  <td className="admin-table-td" style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</td>
                  <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{s.email}</td>
                  <td className="admin-table-td"><StatusBadge status={s.status || 'active'} /></td>
                  <td className="admin-table-td" style={{ color: 'var(--text-light)' }}>{formatDate(s.enrolled_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
