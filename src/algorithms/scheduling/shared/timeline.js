/**
 * Timeline construction helpers for CPU scheduling algorithms.
 * Generates unit-by-unit timeline entries capturing the active running process,
 * ready queue snapshot, and state transition events at every time tick.
 */

/**
 * Creates an execution timeline recorder for tracking discrete state during simulation.
 *
 * @returns {{
 *   record: (time: number, running: string, readyQueue: string[], event?: string) => void,
 *   getTimeline: () => Array<{ time: number, running: string, readyQueue: string[], event: string }>
 * }}
 */
export function createTimelineTracker() {
  const timeline = [];

  return {
    record(time, running, readyQueue, event = '') {
      timeline.push({
        time,
        running: running || 'Idle',
        readyQueue: Array.isArray(readyQueue) ? [...readyQueue] : [],
        event: event || '',
      });
    },
    getTimeline() {
      return timeline;
    },
  };
}

/**
 * Ensures a continuous, strictly validated unit-by-unit timeline of length equal to totalTime.
 * Guarantees every readyQueue contains only arrived, unfinished, non-running processes.
 *
 * @param {Array<object>} rawTimeline - Timeline from recorder (or null)
 * @param {Array<{ pid: string, start: number, end: number, isIdle?: boolean, isContextSwitch?: boolean }>} gantt
 * @param {Array<{ pid: string, at: number, ct: number }>} processes
 * @returns {Array<{ time: number, running: string, readyQueue: string[], event: string }>}
 */
export function finalizeTimeline(rawTimeline, gantt, processes = []) {
  if (!Array.isArray(gantt) || gantt.length === 0) {
    return [];
  }

  const totalTime = Math.max(...gantt.map((b) => b.end), 0);
  const timelineMap = new Map();

  if (Array.isArray(rawTimeline)) {
    for (const entry of rawTimeline) {
      if (entry && typeof entry.time === 'number') {
        timelineMap.set(entry.time, entry);
      }
    }
  }

  const validatedTimeline = [];

  for (let t = 0; t < totalTime; t++) {
    const activeBlock = gantt.find((b) => b.start <= t && t < b.end);
    const isCS = Boolean(activeBlock?.isContextSwitch || activeBlock?.pid === 'CS');
    const isIdle = !isCS && Boolean(activeBlock?.isIdle || activeBlock?.pid === 'Idle');
    const running = isCS ? 'CS' : isIdle ? 'Idle' : (activeBlock?.pid || 'Idle');

    // Valid candidates: arrived at or before t, finishing after t, not currently in CPU
    const validCandidates = processes
      .filter((p) => p.at <= t && p.ct > t && p.pid !== running)
      .map((p) => p.pid);

    let readyQueue = validCandidates;
    let event = '';

    const existing = timelineMap.get(t);
    if (existing) {
      if (Array.isArray(existing.readyQueue) && existing.readyQueue.length > 0) {
        // Retain recorded FIFO / MLFQ queue order while filtering out completed/unarrived processes
        const filtered = existing.readyQueue.filter((pid) => validCandidates.includes(pid));
        for (const pid of validCandidates) {
          if (!filtered.includes(pid)) filtered.push(pid);
        }
        readyQueue = filtered;
      }
      if (existing.event) event = existing.event;
    }

    if (!event) {
      const events = [];
      processes.filter((p) => p.at === t).forEach((p) => events.push(`${p.pid} arrives`));
      processes.filter((p) => p.ct === t).forEach((p) => events.push(`${p.pid} completed`));
      if (activeBlock && activeBlock.start === t) {
        events.push(isCS ? 'Context switch overhead' : isIdle ? 'CPU idle' : `${activeBlock.pid} dispatched`);
      }
      event = events.join(', ');
    }

    validatedTimeline.push({
      time: t,
      running,
      readyQueue,
      event,
    });
  }

  return validatedTimeline;
}

/**
 * Reconstructs a discrete unit-by-unit timeline from Gantt blocks and completed processes.
 *
 * @param {Array<{ pid: string, start: number, end: number, isIdle?: boolean }>} gantt
 * @param {Array<{ pid: string, at: number, ct: number }>} processes
 * @returns {Array<{ time: number, running: string, readyQueue: string[], event: string }>}
 */
export function buildTimeline(gantt, processes = []) {
  return finalizeTimeline(null, gantt, processes);
}
