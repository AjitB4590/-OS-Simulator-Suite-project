/**
 * Process Color Palette and Deterministic Color Assignment.
 * Ensures each process ID receives a distinct, consistent color across all
 * UI components (Gantt chart, process tables, metrics).
 */

const CURATED_PALETTE = [
  '#38bdf8', // Sky Blue
  '#f472b6', // Pink
  '#34d399', // Emerald Green
  '#fbbf24', // Amber
  '#a78bfa', // Purple
  '#fb923c', // Orange
  '#2dd4bf', // Teal
  '#818cf8', // Indigo
  '#e879f9', // Fuchsia
  '#a3e635', // Lime
  '#f87171', // Coral Red
  '#67e8f9', // Cyan
];

/**
 * Returns a stable color hex string for a given process identifier.
 * Uses curated colors for early PIDs and deterministic HSL for higher counts.
 *
 * @param {string} pid - Process identifier (e.g., 'P1', 'P2')
 * @returns {string} Hex or HSL color code
 */
export function getProcessColor(pid) {
  if (!pid || pid === 'Idle' || pid === 'IDLE') {
    return 'var(--idle-block-bg, #334155)';
  }

  const match = String(pid).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    const index = (num - 1) % CURATED_PALETTE.length;
    return CURATED_PALETTE[index];
  }

  // Fallback hash for arbitrary string IDs
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = (hash << 5) - hash + pid.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
