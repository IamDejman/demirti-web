'use client';

export default function AdminStatsGrid({ items, className = '' }) {
  return (
    <div className={`admin-stats-grid ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="admin-stat-card" style={{ borderLeftColor: item.color || 'var(--primary-color)' }}>
          <h3 className="admin-stat-label">{item.label}</h3>
          <p className="admin-stat-value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
