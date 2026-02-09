'use client';

import ChatPanel from '@/app/components/ChatPanel';
import { LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

export default function StudentChatPage() {
  return (
    <div className="space-y-8">
      <LmsPageHeader title="Chat" subtitle="Message your cohort and facilitators." icon={LmsIcons.chat} />
      <ChatPanel />
    </div>
  );
}
