/**
 * Shortest Job First (SJF) CPU Scheduling Algorithm (Non-preemptive).
 * Selects the waiting process with the smallest execution burst time.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { buildTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Shortest Job First (SJF - Non-Preemptive)
 *
 * IDEA:
 * Among all arrived processes, schedules the one with minimal burst time.
 * Runs non-preemptively until completion.
 *
 * PSEUDOCODE:
 * 1. Initialize currentTime = 0, lastRunningPid = null, remaining = processes copy.
 * 2. While remaining is not empty:
 *    a. Filter available = processes with at <= currentTime.
 *    b. If available is empty: jump currentTime to next arrival with Idle block; continue.
 *    c. Sort available: BT ascending -> AT ascending -> PID number ascending.
 *    d. Pick best process p = available[0].
 *    e. Apply CS overhead if switching from another process.
 *    f. Execute p for p.bt, record CT, TAT, WT, RT. Set lastRunningPid = p.pid.
 * 3. Merge Gantt blocks, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n^2) where n is the number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options]
 * @returns {object} Shared result contract
 */
export function simulateSJF(processes, options = {}) {
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

    // Tie-break: Smallest BT -> Earliest AT -> Lower PID number
    available.sort((a, b) => {
      if (a.bt !== b.bt) return a.bt - b.bt;
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
    log.push(`t=${start}: ${p.pid} (BT=${p.bt}) scheduled; completed at t=${ct} (TAT=${tat}, WT=${wt})`);

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
