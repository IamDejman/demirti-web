'use client';

import { useState, useEffect } from 'react';
import ChatPanel from '@/app/components/ChatPanel';
import { LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

export default function FacilitatorChatPage() {
  const [students, setStudents] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Load facilitator's user info
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUserId(data.user.id);
      })
      .catch(() => {});

    // Load all students across the facilitator's cohorts
    (async () => {
      try {
        const cohortsRes = await fetch('/api/cohorts', { headers: getLmsAuthHeaders() });
        const cohortsData = await cohortsRes.json();
        if (!cohortsRes.ok || !cohortsData.cohorts) return;

        const allStudents = [];
        const seen = new Set();

        await Promise.all(
          cohortsData.cohorts.map(async (cohort) => {
            try {
              const res = await fetch(`/api/cohorts/${cohort.id}/students`, { headers: getLmsAuthHeaders() });
              const data = await res.json();
              if (res.ok && data.students) {
                for (const s of data.students) {
                  const userId = s.student_id || s.id;
                  if (!seen.has(userId)) {
                    seen.add(userId);
                    allStudents.push({ ...s, id: s.id, student_id: s.student_id || s.id });
                  }
                }
              }
            } catch { /* skip failing cohort */ }
          })
        );

        setStudents(allStudents);
      } catch { /* silent */ }
    })();
  }, []);

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Chat" subtitle="Message your cohorts and students." icon={LmsIcons.chat} />
      <ChatPanel students={students} currentUserId={currentUserId} />
    </div>
  );
}
