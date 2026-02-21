'use client';

export default function ProgressMilestones({ milestones = [] }) {
  if (milestones.length === 0) return null;

  const lastReachedIndex = milestones.reduce((idx, m, i) => (m.reached ? i : idx), -1);
  const currentIndex = lastReachedIndex + 1;
  const clampedCurrent = Math.min(currentIndex, milestones.length - 1);
  const divisor = Math.max(milestones.length - 1, 1);
  const fillPercent = milestones.length > 0 ? (clampedCurrent / divisor) * 100 : 0;

  return (
    <div className="relative py-2">
      <div
        className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full"
        style={{ background: 'var(--neutral-200)' }}
      />
      <div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-l-full transition-all duration-300"
        style={{
          width: `${fillPercent}%`,
          background: 'var(--primary-color)',
        }}
      />
      <div className="relative flex justify-between">
        {milestones.map((m, i) => {
          const reached = m.reached;
          const isCurrent = !reached && (i === 0 || milestones[i - 1]?.reached);
          return (
            <div key={i} className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  background: reached ? 'var(--primary-color)' : 'var(--neutral-100)',
                  borderColor: reached ? 'var(--primary-color)' : 'var(--neutral-300)',
                  boxShadow: isCurrent ? '0 0 0 3px var(--primary-color)' : 'none',
                  animation: isCurrent ? 'lms-milestone-pulse 1.5s ease-in-out infinite' : 'none',
                }}
              />
              <span
                className="text-xs mt-1 text-center"
                style={{
                  color: reached || isCurrent ? 'var(--neutral-700)' : 'var(--neutral-400)',
                  maxWidth: 60,
                }}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
