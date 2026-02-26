'use client';

import ChatPanel from '@/app/components/ChatPanel';
import { LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function CommunitiesPage() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Communities"
        subtitle="Discuss with your cohort and peers."
        icon={LmsIcons.users}
      />
      <ChatPanel />
    </div>
  );
}
