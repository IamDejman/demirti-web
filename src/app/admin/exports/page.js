'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

const CARD_STYLE = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1rem',
};

const LABEL_STYLE = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
};

const EXPORTS = [
  { type: 'users', label: 'Users', description: 'All registered user accounts' },
  { type: 'cohort_students', label: 'Cohort Enrollments', description: 'Student enrollment records per cohort' },
  { type: 'submissions', label: 'Submissions', description: 'Assignment submissions and grades' },
  { type: 'attendance', label: 'Attendance', description: 'Live class attendance records' },
];

export default function AdminExportsPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);

  const download = (type) => {
    window.open(`/api/admin/exports?type=${type}`, '_blank');
  };

  return (
    <div className="admin-dashboard admin-content-area">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <AdminPageHeader
          title="Data Exports"
          description="Download CSV exports for LMS operations (users, cohort enrollments, submissions, attendance)."
        />

        <div style={CARD_STYLE}>
          <h3 style={{
            ...LABEL_STYLE,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            marginTop: 0,
          }}>Available exports</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {EXPORTS.map((exp) => (
              <div
                key={exp.type}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9375rem' }}>
                    {exp.label}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>
                    {exp.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => download(exp.type)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'var(--primary-color, #0052a3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
