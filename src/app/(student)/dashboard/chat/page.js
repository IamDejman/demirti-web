'use client';

import { useState, useEffect } from 'react';
import ChatPanel from '@/app/components/ChatPanel';
import { LmsPageHeader } from '@/app/components/lms';

export default function StudentChatPage() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Chat" />
      <ChatPanel currentUserId={currentUserId} mode="chat" />
    </div>
  );
}
