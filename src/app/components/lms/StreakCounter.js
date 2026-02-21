'use client';

export default function StreakCounter({ currentStreak = 0, longestStreak }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: 'var(--neutral-100)',
        border: '1px solid var(--border-color)',
      }}
    >
      <span className="text-xl" aria-hidden>🔥</span>
      <div>
        <span className="font-bold tabular-nums" style={{ color: 'var(--neutral-900)', fontSize: 'var(--lms-title-sm)' }}>
          {currentStreak}
        </span>
        <span className="text-sm" style={{ color: 'var(--neutral-500)' }}> day streak</span>
      </div>
      {currentStreak > 0 && (
        <span className="text-sm" style={{ color: 'var(--secondary-color)' }}>Keep it up!</span>
      )}
      {longestStreak != null && longestStreak > 0 && currentStreak !== longestStreak && (
        <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>
          Best: {longestStreak}
        </span>
      )}
    </div>
  );
}
