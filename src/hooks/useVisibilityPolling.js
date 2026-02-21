'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Polls a callback at `intervalMs` but only when the tab is visible.
 * Immediately fires the callback when the tab regains focus after being hidden.
 *
 * @param {Function} callback - async function to call each interval
 * @param {number} intervalMs - polling interval in milliseconds
 * @param {boolean} [enabled=true] - pass false to pause polling entirely
 */
export function useVisibilityPolling(callback, intervalMs, enabled = true) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef(null);
  const wasHidden = useRef(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    if (!document.hidden) startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
        wasHidden.current = true;
      } else {
        if (wasHidden.current) {
          savedCallback.current();
          wasHidden.current = false;
        }
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);
}
