'use client';

import { useState } from 'react';
import { LmsCard, LmsEmptyState } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function CohortStudentsTab({ students }) {
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-6)' }}>
      <LmsCard title="Students" subtitle={`${students.length} enrolled`} icon={LmsIcons.users} hoverable={false}>
        {students.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.users} title="No students enrolled" description="Students enroll through the admin or application flow." />
        ) : (
          <>
            <div className="lms-field" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lms-input"
                style={{ maxWidth: '24rem' }}
              />
            </div>

            <div className="lms-table-wrapper">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="lms-row-item-name">{s.first_name} {s.last_name}</td>
                      <td className="lms-row-item-detail">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {search && filtered.length === 0 && (
              <p className="lms-row-item-detail" style={{ padding: '1rem 0' }}>No students match &quot;{search}&quot;</p>
            )}
          </>
        )}
      </LmsCard>
    </div>
  );
}
