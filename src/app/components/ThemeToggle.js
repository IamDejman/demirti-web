'use client';

import { useRef, useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

const ICON_SUN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const ICON_MOON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ICON_MONITOR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const OPTIONS = [
  { value: 'light', icon: ICON_SUN, label: 'Light' },
  { value: 'dark', icon: ICON_MOON, label: 'Dark' },
  { value: 'system', icon: ICON_MONITOR, label: 'System' },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div className="theme-toggle-wrap" ref={containerRef}>
      <button
        type="button"
        aria-label={`Theme: ${current.label}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`theme-toggle-btn-single ${compact ? 'theme-toggle-btn-icon-only' : ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <span className="theme-toggle-icon">{current.icon}</span>
        {!compact && <span className="theme-toggle-label">{current.label}</span>}
        {!compact && (
          <span className="theme-toggle-chevron" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        )}
      </button>
      {open && (
        <div className="theme-toggle-dropdown" role="listbox" aria-label="Theme options">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={theme === opt.value}
              className={`theme-toggle-dropdown-item ${theme === opt.value ? 'active' : ''}`}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
            >
              <span className="theme-toggle-icon">{opt.icon}</span>
              <span className="theme-toggle-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
