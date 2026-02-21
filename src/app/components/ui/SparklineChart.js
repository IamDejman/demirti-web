'use client';

import { useId } from 'react';

export default function SparklineChart({
  data = [],
  width = 100,
  height = 30,
  color = 'var(--primary-color)',
  filled = false,
}) {
  const gradientId = useId();
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = data.length > 1 ? w / (data.length - 1) : w;

  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const lastPt = points[points.length - 1];
  const [lx, ly] = lastPt ? lastPt.split(',').map(Number) : [pad, pad + h];

  const fillPath = filled
    ? `${polyline} ${width - pad},${height - pad} ${pad},${height - pad}`
    : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none meet"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && fillPath && (
        <polygon
          points={fillPath}
          fill={`url(#${gradientId})`}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lx}
        cy={ly}
        r="2"
        fill={color}
      />
    </svg>
  );
}
