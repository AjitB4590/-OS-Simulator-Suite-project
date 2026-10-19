/**
 * PNG Exporter for Gantt Chart Timeline using html-to-image.
 * Renders the full Gantt chart (including ruler and process legend) at 2x pixel ratio,
 * respecting the active theme's background color.
 */

import { toPng } from 'html-to-image';

/**
 * Captures the Gantt chart DOM element as a PNG data URL at 2x resolution.
 * @param {string} [elementId='gantt-chart-root']
 * @returns {Promise<string>} PNG Data URL
 */
export async function captureGanttPng(elementId = 'gantt-chart-root') {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error(`Gantt chart element "#${elementId}" not found in DOM.`);
  }

  // Determine current computed background color
  const computedBg = window
    .getComputedStyle(document.body)
    .getPropertyValue('background-color')
    .trim();
  const bgColor = computedBg && computedBg !== 'rgba(0, 0, 0, 0)' ? computedBg : '#0f172a';

  return await toPng(node, {
    pixelRatio: 2,
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      borderRadius: '8px',
      padding: '12px',
    },
  });
}

/**
 * Exports the Gantt chart to a downloadable PNG file.
 * @param {{
 *   algorithmId?: string,
 *   elementId?: string
 * }} options
 * @returns {Promise<{ success: boolean, filename?: string, error?: string }>}
 */
export async function exportToPng({ algorithmId = 'scheduling', elementId = 'gantt-chart-root' } = {}) {
  try {
    const dataUrl = await captureGanttPng(elementId);
    const today = new Date().toISOString().slice(0, 10);
    const cleanName = algorithmId.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const filename = `gantt-${cleanName}-${today}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to capture Gantt PNG.' };
  }
}
