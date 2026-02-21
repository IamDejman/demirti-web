'use client';

import { AnimatedCounter } from '@/app/components/ui';

export default function AdminStatsGrid({ items, className = '' }) {
  return (
    <div className={`admin-stats-grid ${className}`}>
      {items.map((item, i) => {
        const accent = item.accent;
        const cardClass = accent ? `admin-stat-card admin-stat-card-accent-${accent}` : 'admin-stat-card';
        const valueClass = accent ? `admin-stat-value admin-stat-value-${accent}` : 'admin-stat-value';
        const style = !accent && item.color ? { borderLeftColor: item.color } : undefined;
        const isNumeric = typeof item.value === 'number';
        const display = isNumeric ? (
          <AnimatedCounter
            value={item.value}
            prefix={item.prefix ?? ''}
            suffix={item.suffix ?? ''}
          />
        ) : (
          item.value
        );
        return (
          <div key={i} className={cardClass} style={style}>
            <h3 className="admin-stat-label">{item.label}</h3>
            <p className={valueClass}>{display}</p>
          </div>
        );
      })}
    </div>
  );
}
