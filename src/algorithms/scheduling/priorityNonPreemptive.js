/**
 * Priority Scheduling Algorithm (Non-preemptive).
 * Allocates CPU based on priority (lower numerical value = higher urgency).
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { buildTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Priority Scheduling (Non-Preemptive)
 *
 * IDEA:
 * Non-preemptive scheduling allocating the CPU to the arrived job with highest priority.
 *
 * PSEUDOCODE:
 * 1. Initialize currentTime = 0, lastRunningPid = null, remaining = processes copy.
 * 2. While remaining is not empty:
 *    a. Filter available = arrived processes. If empty, advance time with Idle block.
 *    b. Sort: Priority ascending -> AT ascending -> PID number ascending.
 *    c. Apply CS overhead if switching between different processes.
 *    d. Execute chosen process to completion. Set lastRunningPid = p.pid.
 * 3. Merge Gantt, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n^2) where n is number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority: number }>} processes
 * @param {object} [options]
 * @returns {object} Shared result contract
 */
export function simulatePriorityNonPreemptive(processes, options = {}) {
  const csOverhead = Number(options?.contextSwitchOverhead) > 0 ? Number(options.contextSwitchOverhead) : 0;

  if (!processes || processes.length === 0) {
    return {
      gantt: [],
      processes: [],
      timeline: [],
      log: ['No processes provided.'],
      metrics: computeMetrics([], [], options),
    };
  }

  let remaining = processes.map((p) => ({
    pid: p.pid,
    at: Number(p.at),
    bt: Number(p.bt),
    priority: p.priority !== undefined ? Number(p.priority) : 1,
  }));

  let currentTime = 0;
  let lastRunningPid = null;
  const rawGantt = [];
  const completed = [];
  const log = [];

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.at <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.at));
      rawGantt.push({ pid: 'Idle', start: currentTime, end: nextArrival, isIdle: true });
      log.push(`t=${currentTime}: CPU idle until next arrival at t=${nextArrival}`);
      currentTime = nextArrival;
      continue;
    }

    available.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.at !== b.at) return a.at - b.at;
      return getPidNumber(a.pid) - getPidNumber(b.pid);
    });

    const p = available[0];
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, csOverhead, log);

    const start = currentTime;
    const rt = start - p.at;
    currentTime += p.bt;
    const ct = currentTime;
    const tat = ct - p.at;
    const wt = tat - p.bt;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start, end: ct, isIdle: false });
    completed.push({ ...p, ct, tat, wt, rt });
    log.push(`t=${start}: ${p.pid} (Priority=${p.priority}) executed; finished at t=${ct}`);

    remaining = remaining.filter((x) => x.pid !== p.pid);
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  const timeline = buildTimeline(gantt, completed);
  const metrics = computeMetrics(sortedProcesses, gantt, options);

  return {
    gantt,
    processes: sortedProcesses,
    timeline,
    log,
    metrics,
  };
}
