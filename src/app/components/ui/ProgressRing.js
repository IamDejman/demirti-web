'use client';

import { useState, useEffect } from 'react';

export default function ProgressRing({
  percent = 0,
  size = 80,
  strokeWidth = 6,
  color = 'var(--primary-color)',
  label,
}) {
  const [mounted, setMounted] = useState(false);
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="progress-ring"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--neutral-200, #e2e8f0)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease-out',
          }}
        />
      </svg>
      <div
        style={{
          position: 'relative',
          fontSize: size <= 48 ? '0.75rem' : '0.875rem',
          fontWeight: 600,
          color: 'var(--neutral-900)',
        }}
      >
        {label !== undefined ? label : `${clamped}%`}
      </div>
    </div>
  );
}
