'use client';

export default function AdminEmptyState({ message, description, icon, action }) {
  return (
    <div className="admin-empty-state">
      {icon && <div className="admin-empty-state-icon">{icon}</div>}
      <p className="admin-empty-state-message">{message}</p>
      {description && (
        <p className="admin-empty-state-description">{description}</p>
      )}
      {action && <div className="admin-empty-state-action">{action}</div>}
    </div>
  );
}
