/**
 * Highest Response Ratio Next (HRRN) CPU Scheduling Algorithm (Non-preemptive).
 * Mitigates starvation by balancing burst time with accrued waiting time.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { buildTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Highest Response Ratio Next (HRRN)
 *
 * IDEA:
 * Non-preemptive scheduling where the process with the highest Response Ratio (RR)
 * is chosen next. Formula: Ratio = (Waiting Time + Burst Time) / Burst Time.
 * As a process waits longer, its ratio increases, effectively preventing starvation.
 *
 * PSEUDOCODE:
 * 1. Initialize currentTime = 0, lastRunningPid = null, remaining = processes copy.
 * 2. While remaining is not empty:
 *    a. Filter available = processes with at <= currentTime.
 *    b. If available is empty: jump currentTime to next arrival with Idle block; continue.
 *    c. Calculate response ratio for each candidate: R = ((currentTime - at) + bt) / bt.
 *    d. Sort by: Ratio descending -> AT ascending -> PID number ascending.
 *    e. Pick highest ratio process p = available[0].
 *    f. Apply CS overhead if switching between different processes.
 *    g. Execute p to completion; record CT, TAT, WT, RT. Set lastRunningPid = p.pid.
 * 3. Merge Gantt blocks, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n^2) where n is number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options]
 * @returns {object} Shared result contract
 */
export function simulateHRRN(processes, options = {}) {
  const cs = Number(options?.contextSwitchOverhead) > 0 ? Number(options.contextSwitchOverhead) : 0;

  if (!processes || processes.length === 0) {
    return {
      gantt: [], processes: [], timeline: [],
      log: ['No processes provided.'], metrics: computeMetrics([], [], options),
    };
  }

  let remaining = processes.map((p) => ({
    pid: p.pid, at: Number(p.at), bt: Number(p.bt),
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

    // Compute response ratio for each candidate: (waiting + bt) / bt
    const candidates = available.map((p) => {
      const waiting = currentTime - p.at;
      const ratio = (waiting + p.bt) / p.bt;
      return { ...p, waiting, ratio };
    });

    // Tie-break: highest ratio -> earliest arrival -> lower PID number
    candidates.sort((a, b) => {
      if (Math.abs(b.ratio - a.ratio) > 1e-6) return b.ratio - a.ratio;
      if (a.at !== b.at) return a.at - b.at;
      return getPidNumber(a.pid) - getPidNumber(b.pid);
    });

    const p = candidates[0];
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, cs, log);

    const start = currentTime;
    const rt = start - p.at;
    currentTime += p.bt;
    const ct = currentTime;
    const tat = ct - p.at;
    const wt = tat - p.bt;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start, end: ct, isIdle: false });
    completed.push({ pid: p.pid, at: p.at, bt: p.bt, priority: p.priority, ct, tat, wt, rt });
    log.push(
      `t=${start}: ${p.pid} chosen (Ratio=${p.ratio.toFixed(2)}, WT so far=${p.waiting}); finishes at t=${ct} (TAT=${tat}, WT=${wt})`
    );

    remaining = remaining.filter((x) => x.pid !== p.pid);
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  const timeline = buildTimeline(gantt, completed);

  return {
    gantt, processes: sortedProcesses, timeline,
    log, metrics: computeMetrics(sortedProcesses, gantt, options),
  };
}
