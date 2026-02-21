'use client';

import { useState } from 'react';

export default function AchievementBadges({ achievements = [], allBadges }) {
  const earnedIds = new Set((achievements || []).map((a) => a.id));
  const displayBadges = allBadges
    ? allBadges.map((b) => ({
        ...b,
        earned: earnedIds.has(b.id),
        earnedAt: achievements?.find((a) => a.id === b.id)?.earnedAt,
      }))
    : achievements.map((a) => ({ ...a, earned: true }));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      {displayBadges.map((badge) => (
        <BadgeItem key={badge.id} badge={badge} />
      ))}
    </div>
  );
}

function BadgeItem({ badge }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const dateStr = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="relative flex-shrink-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{
          background: badge.earned ? 'var(--primary-color)' : 'var(--neutral-200)',
          color: badge.earned ? 'white' : 'var(--neutral-400)',
          opacity: badge.earned ? 1 : 0.6,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="img"
        aria-label={badge.name}
        title={badge.name + (dateStr ? ` • ${dateStr}` : '')}
      >
        {badge.icon || '🏅'}
      </div>
      {showTooltip && (
        <div
          className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap"
          style={{
            background: 'var(--neutral-800)',
            color: 'var(--neutral-100)',
          }}
        >
          {badge.name}
          {dateStr && <span className="block text-[10px]" style={{ color: 'var(--neutral-400)' }}>{dateStr}</span>}
        </div>
      )}
    </div>
  );
}
