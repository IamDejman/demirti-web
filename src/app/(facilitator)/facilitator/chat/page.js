'use client';

import ChatPanel from '@/app/components/ChatPanel';
import { LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function FacilitatorChatPage() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Chat" subtitle="Message your cohorts and students." icon={LmsIcons.chat} />
      <ChatPanel />
    </div>
  );
}
