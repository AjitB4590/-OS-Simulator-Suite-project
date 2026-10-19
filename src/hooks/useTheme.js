/**
 * Custom React hook for theme management (Dark / Light mode).
 * Defaults to system prefers-color-scheme, persists preference in localStorage,
 * and synchronizes the 'data-theme' attribute on document.documentElement.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'os_simulator_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // 1. Check persistent user preference in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // 2. Default to system prefers-color-scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  useEffect(() => {
    // Synchronize HTML data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Toggle between dark and light modes
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}
