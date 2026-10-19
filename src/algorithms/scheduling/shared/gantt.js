/**
 * Gantt Chart helper functions for CPU scheduling visualization.
 * Merges adjacent execution slices belonging to the same process, idle state,
 * or context switch overhead to produce a clean, continuous visual timeline.
 */

/**
 * Merges adjacent Gantt chart blocks that share the same PID and state.
 *
 * @param {Array<{ pid: string, start: number, end: number, isIdle?: boolean, isContextSwitch?: boolean }>} blocks
 * @returns {Array<{ pid: string, start: number, end: number, isIdle: boolean, isContextSwitch?: boolean }>}
 */
export function mergeGanttBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }

  const merged = [];

  for (const block of blocks) {
    if (block.start === block.end) {
      continue;
    }

    const isContextSwitch = Boolean(block.isContextSwitch || block.pid === 'CS');
    const isIdle = !isContextSwitch && Boolean(block.isIdle || block.pid === 'Idle' || block.pid === 'IDLE');
    const pid = isContextSwitch ? 'CS' : isIdle ? 'Idle' : block.pid;

    if (merged.length === 0) {
      const entry = { pid, start: block.start, end: block.end, isIdle };
      if (isContextSwitch) entry.isContextSwitch = true;
      merged.push(entry);
      continue;
    }

    const prev = merged[merged.length - 1];

    if (
      prev.pid === pid &&
      prev.isIdle === isIdle &&
      Boolean(prev.isContextSwitch) === isContextSwitch &&
      prev.end === block.start
    ) {
      prev.end = block.end;
    } else {
      const entry = { pid, start: block.start, end: block.end, isIdle };
      if (isContextSwitch) entry.isContextSwitch = true;
      merged.push(entry);
    }
  }

  return merged;
}
