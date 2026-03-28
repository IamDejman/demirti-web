'use client';

const VARIANTS = {
  success: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981' },
  warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  danger:  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' },
  info:    { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#6366f1' },
  neutral: { bg: '#f9fafb', text: '#374151', border: '#e5e7eb', dot: '#9ca3af' },
};

export default function LmsBadge({ variant = 'neutral', children, dot }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium leading-tight whitespace-nowrap"
      style={{
        padding: '2px 10px',
        borderRadius: 'var(--radius-full, 9999px)',
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: v.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}
