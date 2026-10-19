/**
 * Theme Toggle Button component.
 * Allows users to toggle between Light and Dark interface themes,
 * rendering accessible labels and distinct icons.
 */

/**
 * @param {{ isDark: boolean, onToggle: () => void }} props
 */
export function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
