'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, title, children, footer }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={overlayRef}
      className="ui-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'ui-modal-title' : undefined}
        tabIndex={-1}
        className="ui-modal"
      >
        <div className="ui-modal__header">
          {title && (
            <h2 id="ui-modal-title" className="ui-modal__title">
              {title}
            </h2>
          )}
          <button
            type="button"
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
      <style jsx>{`
        .ui-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ui-modal-overlay.ui-modal-overlay--exiting {
          animation: overlayOut 0.2s ease forwards;
        }
        @keyframes overlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .ui-modal {
          background: var(--background-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          max-width: 500px;
          width: 100%;
          max-height: calc(100vh - 2rem);
          display: flex;
          flex-direction: column;
          animation: modalIn 0.25s ease;
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .ui-modal:focus {
          outline: none;
        }
        .ui-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        .ui-modal__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-color);
          margin: 0;
        }
        .ui-modal__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-light);
          font-size: 1.5rem;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .ui-modal__close:hover {
          background: var(--background-light);
          color: var(--text-color);
        }
        .ui-modal__close:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .ui-modal__body {
          padding: 1.25rem;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }
        .ui-modal__footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }
        @media (max-width: 480px) {
          .ui-modal {
            max-width: 100%;
            border-radius: 0;
            height: 100%;
            max-height: 100vh;
          }
          .ui-modal-overlay {
            padding: 0;
          }
          .ui-modal__close {
            width: 44px;
            height: 44px;
            font-size: 1.75rem;
          }
          .ui-modal__header {
            padding: 0.75rem 1rem;
          }
          .ui-modal__body {
            padding: 1rem;
          }
          .ui-modal__footer {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}

export default Modal;
