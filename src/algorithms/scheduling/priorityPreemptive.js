/**
 * Priority Scheduling Algorithm (Preemptive).
 * Allocates CPU to the highest priority process (lowest numerical value).
 * Higher priority arrivals immediately preempt running jobs.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { createTimelineTracker, finalizeTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Priority Scheduling (Preemptive)
 *
 * IDEA:
 * The CPU is always assigned to the available process with the highest priority
 * (lowest priority number). If a newly arrived process has higher priority than the
 * currently running job, the current job is preempted.
 *
 * PSEUDOCODE:
 * 1. Initialize rbt = bt, currentTime = 0, lastRunningPid = null.
 * 2. While processes remain unfinished:
 *    a. Filter arrived processes with rbt > 0. If empty, advance time (Idle).
 *    b. Pick p with highest priority (min priority) -> tie-break earlier AT -> lower PID.
 *    c. Apply CS overhead if switching between different processes.
 *    d. Calculate duration = min(p.rbt, time until a higher-priority process arrives).
 *    e. Execute p for duration; decrement p.rbt; record RT on first dispatch.
 *    f. If p.rbt == 0, record completion (CT, TAT, WT).
 * 3. Merge Gantt blocks, build timeline & logs, compute metrics.
 *
 * TIME COMPLEXITY: O(n^2) where n is the number of processes.
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority: number }>} processes
 * @param {object} [options]
 * @returns {object} Shared result contract
 */
export function simulatePriorityPreemptive(processes, options = {}) {
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

    // Tie-break: highest priority (lowest number) -> earliest at -> lower PID number
    available.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.at !== b.at) return a.at - b.at;
      return getPidNumber(a.pid) - getPidNumber(b.pid);
    });

    const p = available[0];
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, cs, log);

    const startTime = currentTime;
    if (!p.started) { p.rt = startTime - p.at; p.started = true; }

    // Check when a process with strictly higher priority will arrive
    const higherPriorityArrivals = procs.filter(
      (x) => x.at > currentTime && x.rbt > 0 && (
        x.priority < p.priority ||
        (x.priority === p.priority && x.at < p.at) ||
        (x.priority === p.priority && x.at === p.at && getPidNumber(x.pid) < getPidNumber(p.pid))
      )
    );
    const nextPreemptTime = higherPriorityArrivals.length > 0
      ? Math.min(...higherPriorityArrivals.map((x) => x.at))
      : Infinity;

    const execTime = Math.min(p.rbt, nextPreemptTime - currentTime);
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
      log.push(`t=${ct}: ${p.pid} (Priority=${p.priority}) completed (TAT=${ct - p.at}, WT=${ct - p.at - p.bt})`);
    } else {
      log.push(`t=${currentTime}: ${p.pid} preempted by higher priority arrival (rem BT=${p.rbt})`);
    }
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  return {
    gantt, processes: sortedProcesses, timeline: finalizeTimeline(tracker.getTimeline(), gantt, completed),
    log, metrics: computeMetrics(sortedProcesses, gantt, options),
  };
}
