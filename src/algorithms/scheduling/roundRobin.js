/**
 * Round Robin (RR) CPU Scheduling Algorithm (Preemptive).
 * Executes processes for a fixed Time Quantum (TQ) in a cyclical FIFO ready queue.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { createTimelineTracker, finalizeTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Round Robin (RR)
 *
 * IDEA:
 * Allocates a fixed Time Quantum per process in FIFO order. If a process does not
 * finish within its slice, it is preempted. New arrivals join the queue before preempted jobs.
 *
 * TIME COMPLEXITY: O(n * (max_bt / quantum))
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {{ quantum?: number, contextSwitchOverhead?: number }} [options]
 * @returns {object} Shared result contract
 */
export function simulateRoundRobin(processes, options = {}) {
  const quantum = Number(options?.quantum) > 0 ? Number(options.quantum) : 2;
  const cs = Number(options?.contextSwitchOverhead) > 0 ? Number(options.contextSwitchOverhead) : 0;

  if (!processes || processes.length === 0) {
    return {
      gantt: [], processes: [], timeline: [],
      log: ['No processes provided.'], metrics: computeMetrics([], [], options),
    };
  }

  const procs = processes.map((p) => ({
    pid: p.pid, at: Number(p.at), bt: Number(p.bt),
    priority: p.priority !== undefined ? Number(p.priority) : 1,
    rbt: Number(p.bt), started: false, rt: 0,
  })).sort((a, b) => a.at !== b.at ? a.at - b.at : getPidNumber(a.pid) - getPidNumber(b.pid));

  let currentTime = 0;
  let idx = 0;
  let lastRunningPid = null;
  const queue = [];
  const rawGantt = [];
  const completed = [];
  const log = [];
  const tracker = createTimelineTracker();

  const enqueueArrivals = () => {
    while (idx < procs.length && procs[idx].at <= currentTime) {
      queue.push(procs[idx]);
      log.push(`t=${procs[idx].at}: ${procs[idx].pid} entered ready queue`);
      idx++;
    }
  };

  enqueueArrivals();

  while (queue.length > 0 || idx < procs.length) {
    if (queue.length === 0) {
      const nextArrival = procs[idx].at;
      rawGantt.push({ pid: 'Idle', start: currentTime, end: nextArrival, isIdle: true });
      log.push(`t=${currentTime}: CPU idle until t=${nextArrival}`);
      for (let t = currentTime; t < nextArrival; t++) tracker.record(t, 'Idle', []);
      currentTime = nextArrival;
      enqueueArrivals();
    }

    const p = queue.shift();
    const prevTime = currentTime;
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, cs, log);
    if (currentTime > prevTime) enqueueArrivals();

    const startTime = currentTime;
    if (!p.started) { p.rt = startTime - p.at; p.started = true; }

    const execTime = Math.min(p.rbt, quantum);
    p.rbt -= execTime;
    currentTime += execTime;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start: startTime, end: currentTime, isIdle: false });
    for (let t = startTime; t < currentTime; t++) {
      tracker.record(t, p.pid, queue.map((q) => q.pid));
    }

    enqueueArrivals();

    if (p.rbt > 0) {
      queue.push(p);
      log.push(`t=${currentTime}: ${p.pid} preempted (rem BT=${p.rbt}), requeued`);
    } else {
      const ct = currentTime;
      completed.push({ ...p, ct, tat: ct - p.at, wt: ct - p.at - p.bt, rt: p.rt });
      log.push(`t=${ct}: ${p.pid} completed execution (TAT=${ct - p.at}, WT=${ct - p.at - p.bt})`);
    }
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  return {
    gantt, processes: sortedProcesses, timeline: finalizeTimeline(tracker.getTimeline(), gantt, completed),
    log, metrics: computeMetrics(sortedProcesses, gantt, options),
  };
}
