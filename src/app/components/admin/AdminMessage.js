'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useToast } from '../ToastProvider';

export default function AdminMessage({ type = 'info', children }) {
  const { showToast } = useToast();
  const lastErrorRef = useRef('');

  const message = useMemo(() => {
    if (typeof children === 'string') return children.trim();
    if (typeof children === 'number') return String(children);
    return '';
  }, [children]);

  useEffect(() => {
    if (type !== 'error' || !message) {
      lastErrorRef.current = '';
      return;
    }
    if (lastErrorRef.current === message) return;
    lastErrorRef.current = message;
    showToast({ type: 'error', message });
  }, [type, message, showToast]);

  if (type === 'error') return null;

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
