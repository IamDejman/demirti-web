'use client';

import ChatPanel from '@/app/components/ChatPanel';

export default function StudentChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="text-gray-600 mt-1">Message your cohort and facilitators.</p>
      </div>
      <ChatPanel />
    </div>
  );
}
