'use client';

export default function AdminMessage({ type = 'info', children }) {
  const typeClass = {
    success: 'admin-message-success',
    error: 'admin-message-error',
    info: 'admin-message-info',
  }[type] || 'admin-message-info';

  return (
    <div className={`admin-message ${typeClass}`} role="alert">
      {children}
    </div>
  );
}
