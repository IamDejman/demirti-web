'use client';

export default function AdminCard({ title, children, className = '' }) {
  return (
    <div className={`admin-card ${className}`}>
      {title && (
        <h2 className="admin-card-title">{title}</h2>
      )}
      <div className="admin-card-body">
        {children}
      </div>
    </div>
  );
}
