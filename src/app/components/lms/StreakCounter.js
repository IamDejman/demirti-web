'use client';

export default function StreakCounter({ currentStreak = 0, longestStreak }) {
  return (
    <div
      className="inline-flex items-center flex-nowrap gap-3 rounded-lg"
      style={{
        background: 'var(--neutral-100)',
        border: '1px solid var(--border-color)',
        padding: '0.625rem 1.5rem',
      }}
    >
      <span className="inline-flex items-center text-xl leading-none" aria-hidden>🔥</span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="font-bold tabular-nums" style={{ color: 'var(--neutral-900)', fontSize: 'var(--lms-title-sm)' }}>
          {currentStreak}
        </span>
        <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>day streak</span>
      </span>
      {currentStreak > 0 && (
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--secondary-color)' }}>Keep it up!</span>
      )}
      {longestStreak != null && longestStreak > 0 && currentStreak !== longestStreak && (
        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--neutral-500)' }}>
          Best: {longestStreak}
        </span>
      )}
    </div>
  );
}
