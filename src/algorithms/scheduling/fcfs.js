/**
 * First-Come, First-Served (FCFS) CPU Scheduling Algorithm.
 * Dispatches processes strictly according to arrival order. Non-preemptive.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { buildTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: First Come First Served (FCFS)
 *
 * IDEA:
 * Executes tasks in strict arrival order. If CPU is idle, it waits for the next arrival.
 * Non-preemptive: scheduled processes run uninterrupted until completion.
 *
 * PSEUDOCODE:
 * 1. Sort processes by arrival time (AT ascending), tie-break by lower PID.
 * 2. Set currentTime = 0, lastRunningPid = null.
 * 3. For each process p:
 *    a. If switching from another process, insert CS overhead block [currentTime, currentTime + cs].
 *    b. If currentTime < p.at, insert Idle block [currentTime, p.at]; currentTime = p.at.
 *    c. Record start = currentTime, rt = start - p.at.
 *    d. Execute for p.bt: ct = currentTime + p.bt, tat = ct - p.at, wt = tat - p.bt.
 *    e. Record Gantt slice, advance currentTime = ct, set lastRunningPid = p.pid.
 * 4. Merge Gantt blocks, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n log n) due to sorting, where n is number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options] - Simulation options (contextSwitchOverhead, etc.)
 * @returns {object} Shared result contract
 */
export function simulateFCFS(processes, options = {}) {
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

  const queue = [...processes].map((p) => ({
    pid: p.pid,
    at: Number(p.at),
    bt: Number(p.bt),
    priority: p.priority !== undefined ? Number(p.priority) : 1,
  })).sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    return getPidNumber(a.pid) - getPidNumber(b.pid);
  });

  let currentTime = 0;
  let lastRunningPid = null;
  const rawGantt = [];
  const completed = [];
  const log = [];

  for (const p of queue) {
    log.push(`t=${p.at}: ${p.pid} arrived (BT=${p.bt})`);

    // Handle context switch overhead if switching between different active processes
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, csOverhead, log);

    // Handle idle CPU gap
    if (currentTime < p.at) {
      rawGantt.push({ pid: 'Idle', start: currentTime, end: p.at, isIdle: true });
      log.push(`t=${currentTime}: CPU idle until t=${p.at}`);
      currentTime = p.at;
    }

    const start = currentTime;
    const rt = start - p.at;
    currentTime += p.bt;
    const ct = currentTime;
    const tat = ct - p.at;
    const wt = tat - p.bt;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start, end: ct, isIdle: false });
    completed.push({ ...p, ct, tat, wt, rt });
    log.push(`t=${start}: ${p.pid} allocated CPU; completed at t=${ct} (TAT=${tat}, WT=${wt}, RT=${rt})`);
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
