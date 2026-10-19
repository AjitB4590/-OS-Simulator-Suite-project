/**
 * Shortest Remaining Time First (SRTF) CPU Scheduling Algorithm.
 * Preemptive variant of Shortest Job First (SJF).
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { createTimelineTracker, finalizeTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Shortest Remaining Time First (SRTF - Preemptive SJF)
 *
 * IDEA:
 * The process with the smallest remaining burst time is allocated the CPU.
 * A newly arriving process can preempt the currently running job if its burst time
 * is shorter than the current job's remaining burst time.
 *
 * PSEUDOCODE:
 * 1. Initialize remaining burst times (rbt = bt), currentTime = 0, lastRunningPid = null.
 * 2. While processes remain unfinished:
 *    a. Filter arrived & unfinished processes. If none, advance to next arrival (Idle).
 *    b. Pick p with min rbt -> tie-break by earlier AT -> lower PID number.
 *    c. Apply context switch overhead if switching between different processes.
 *    d. Calculate duration = min(p.rbt, time until next process arrival).
 *    e. Execute p for duration; decrement p.rbt; record RT on first dispatch.
 *    f. If p.rbt == 0, record completion (CT, TAT, WT).
 * 3. Merge Gantt blocks, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n^2) where n is the number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options]
 * @returns {object} Shared result contract
 */
export function simulateSRTF(processes, options = {}) {
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
  }));

  let currentTime = 0;
  let lastRunningPid = null;
  const rawGantt = [];
  const completed = [];
  const log = [];
  const tracker = createTimelineTracker();

  while (completed.length < procs.length) {
    const available = procs.filter((p) => p.at <= currentTime && p.rbt > 0);

    if (available.length === 0) {
      const unarrived = procs.filter((p) => p.at > currentTime);
      const nextArrival = Math.min(...unarrived.map((p) => p.at));
      rawGantt.push({ pid: 'Idle', start: currentTime, end: nextArrival, isIdle: true });
      log.push(`t=${currentTime}: CPU idle until next arrival at t=${nextArrival}`);
      for (let t = currentTime; t < nextArrival; t++) tracker.record(t, 'Idle', []);
      currentTime = nextArrival;
      continue;
    }

    // Tie-break: smallest rbt -> earliest at -> lower PID number
    available.sort((a, b) => {
      if (a.rbt !== b.rbt) return a.rbt - b.rbt;
      if (a.at !== b.at) return a.at - b.at;
      return getPidNumber(a.pid) - getPidNumber(b.pid);
    });

    const p = available[0];
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, cs, log);

    const startTime = currentTime;
    if (!p.started) { p.rt = startTime - p.at; p.started = true; }

    // Preemption only possible when a new process arrives before p completes
    const futureArrivals = procs.filter((x) => x.at > currentTime && x.rbt > 0);
    const nextArrTime = futureArrivals.length > 0 ? Math.min(...futureArrivals.map((x) => x.at)) : Infinity;
    const execTime = Math.min(p.rbt, nextArrTime - currentTime);

    p.rbt -= execTime;
    currentTime += execTime;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start: startTime, end: currentTime, isIdle: false });
    const readyQueuePids = available.filter((x) => x.pid !== p.pid).map((x) => x.pid);
    for (let t = startTime; t < currentTime; t++) {
      tracker.record(t, p.pid, readyQueuePids);
    }

    if (p.rbt === 0) {
      const ct = currentTime;
      completed.push({ ...p, ct, tat: ct - p.at, wt: ct - p.at - p.bt, rt: p.rt });
      log.push(`t=${ct}: ${p.pid} finished execution (TAT=${ct - p.at}, WT=${ct - p.at - p.bt})`);
    } else {
      log.push(`t=${currentTime}: ${p.pid} running (rem BT=${p.rbt})`);
    }
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  return {
    gantt, processes: sortedProcesses, timeline: finalizeTimeline(tracker.getTimeline(), gantt, completed),
    log, metrics: computeMetrics(sortedProcesses, gantt, options),
  };
}
