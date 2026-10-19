/**
 * Generic LocalStorage Hook with optional debounced synchronization.
 * Safely reads and persists JSON-serializable state to window.localStorage,
 * catching quota errors and corrupted payloads without crashing.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * @template T
 * @param {string} key LocalStorage key
 * @param {T} initialValue Default fallback value
 * @param {{ debounceMs?: number }} [options]
 * @returns {[T, (value: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue, { debounceMs = 0 } = {}) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      // Gracefully fall back to initial value if localStorage is inaccessible
      return initialValue;
    }
  });

  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const save = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch {
        // Suppress quota or security errors gracefully
      }
    };

    if (debounceMs > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, debounceMs);
    } else {
      save();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, storedValue, debounceMs]);

  return [storedValue, setStoredValue];
}
