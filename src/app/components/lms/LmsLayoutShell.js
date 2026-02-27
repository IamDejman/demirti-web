'use client';

import LmsTopNav from './LmsTopNav';

export default function LmsLayoutShell({ variant = 'student', children, user, pendingCount = 0, topBarContent, unreadAnnouncements = 0 }) {
  return (
    <div className="lms-app">
      <LmsTopNav
        variant={variant}
        user={user}
        pendingCount={pendingCount}
        topBarContent={topBarContent}
        unreadAnnouncements={unreadAnnouncements}
      />
      <main className="lms-main">
        <div className="lms-main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
