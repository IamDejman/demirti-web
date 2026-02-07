'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '../../components/admin';

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
    <div className="admin-dashboard admin-dashboard-content" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Data Exports"
          description="Download CSV exports for LMS operations (users, cohort enrollments, submissions, attendance)."
        />
        <div className="mt-6 grid gap-3">
          <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => download('users')}>
            Export users
          </button>
          <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => download('cohort_students')}>
            Export cohort enrollments
          </button>
          <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => download('submissions')}>
            Export submissions
          </button>
          <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => download('attendance')}>
            Export attendance
          </button>
        </div>
    </div>
  );
}
