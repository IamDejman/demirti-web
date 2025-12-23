'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ message, type = 'error', duration = 5000 }) => {
    if (!message) return;

    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          pointerEvents: 'none',
        }}
        aria-live="assertive"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              minWidth: '260px',
              maxWidth: '360px',
              backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
              {toast.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}


