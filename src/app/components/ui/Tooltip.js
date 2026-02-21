'use client';

import { useState, useRef } from 'react';

function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef(null);

  const handleMouseEnter = () => setVisible(true);
  const handleMouseLeave = () => setVisible(false);
  const handleFocus = () => setVisible(true);
  const handleBlur = () => setVisible(false);

  return (
    <>
      <span
        ref={wrapperRef}
        className="ui-tooltip-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
        {visible && (
          <span
            role="tooltip"
            className={`ui-tooltip ui-tooltip--${position}`}
          >
            {content}
          </span>
        )}
      </span>
      <style jsx>{`
        .ui-tooltip-wrapper {
          position: relative;
          display: inline-flex;
        }
        .ui-tooltip {
          position: absolute;
          z-index: 1000;
          padding: 0.375rem 0.625rem;
          font-size: 0.8125rem;
          line-height: 1.4;
          color: var(--neutral-100);
          background: var(--neutral-800);
          border-radius: 6px;
          max-width: 220px;
          white-space: normal;
          box-shadow: var(--shadow-md);
          animation: tooltipIn 0.15s ease;
        }
        @keyframes tooltipIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ui-tooltip--top {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-6px);
        }
        .ui-tooltip--top::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: var(--neutral-800);
        }
        .ui-tooltip--bottom {
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(6px);
        }
        .ui-tooltip--bottom::after {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-bottom-color: var(--neutral-800);
        }
        .ui-tooltip--left {
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-6px);
        }
        .ui-tooltip--left::after {
          content: '';
          position: absolute;
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: var(--neutral-800);
        }
        .ui-tooltip--right {
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(6px);
        }
        .ui-tooltip--right::after {
          content: '';
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: var(--neutral-800);
        }
      `}</style>
    </>
  );
}

export default Tooltip;
