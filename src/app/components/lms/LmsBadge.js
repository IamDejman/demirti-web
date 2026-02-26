'use client';

const VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function LmsBadge({ variant = 'neutral', children, dot }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.6875rem] font-medium leading-tight rounded-md border whitespace-nowrap ${VARIANTS[variant] || VARIANTS.neutral}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}
