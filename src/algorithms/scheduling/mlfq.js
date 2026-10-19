/**
 * Multilevel Feedback Queue (MLFQ) CPU Scheduling Algorithm.
 * Configurable multi-priority queues with descending priorities and expanding time slices.
 * New processes enter Queue 0; jobs using full quantum are demoted; lowest queue is FCFS.
 */

import { mergeGanttBlocks } from './shared/gantt.js';
import { computeMetrics, getPidNumber, sortProcessesByPid } from './shared/metrics.js';
import { createTimelineTracker, finalizeTimeline } from './shared/timeline.js';
import { handleContextSwitch } from './shared/contextSwitch.js';

/**
 * ALGORITHM: Multilevel Feedback Queue (MLFQ)
 *
 * IDEA:
 * Multiple ready queues with decreasing priority. Higher queues have smaller time quanta.
 * New arrivals enter the top queue (Q0). A process using its full quantum drops to the next queue.
 * The bottom queue runs FCFS. Higher queues strictly preempt lower queues.
 *
 * TIME COMPLEXITY: O(totalTime * n)
 * SPACE COMPLEXITY: O(n + totalTime)
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {{ queues?: number, quantums?: number[], contextSwitchOverhead?: number }} [options]
 * @returns {object} Shared result contract
 */
export function simulateMLFQ(processes, options = {}) {
  const numQueues = Math.max(1, Number(options?.queues) || 3);
  const quantums = Array.isArray(options?.quantums) && options.quantums.length > 0
    ? options.quantums
    : [2, 4, 8];
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
    rbt: Number(p.bt), started: false, rt: 0, queueLevel: 0,
  })).sort((a, b) => a.at !== b.at ? a.at - b.at : getPidNumber(a.pid) - getPidNumber(b.pid));

  const queues = Array.from({ length: numQueues }, () => []);
  let currentTime = 0;
  let idx = 0;
  let lastRunningPid = null;
  const rawGantt = [];
  const completed = [];
  const log = [];
  const tracker = createTimelineTracker();

  const enqueueArrivals = () => {
    while (idx < procs.length && procs[idx].at <= currentTime) {
      queues[0].push(procs[idx]);
      log.push(`t=${procs[idx].at}: ${procs[idx].pid} arrived and placed in Queue 0`);
      idx++;
    }
  };

  enqueueArrivals();

  while (completed.length < procs.length) {
    let activeQ = -1;
    for (let q = 0; q < numQueues; q++) {
      if (queues[q].length > 0) { activeQ = q; break; }
    }

    if (activeQ === -1) {
      const nextArrival = procs[idx].at;
      rawGantt.push({ pid: 'Idle', start: currentTime, end: nextArrival, isIdle: true });
      log.push(`t=${currentTime}: CPU idle until next arrival at t=${nextArrival}`);
      for (let t = currentTime; t < nextArrival; t++) tracker.record(t, 'Idle', []);
      currentTime = nextArrival;
      enqueueArrivals();
      continue;
    }

    const p = queues[activeQ].shift();
    const prevTime = currentTime;
    currentTime = handleContextSwitch(rawGantt, lastRunningPid, p.pid, currentTime, cs, log);
    if (currentTime > prevTime) enqueueArrivals();

    const startTime = currentTime;
    if (!p.started) { p.rt = startTime - p.at; p.started = true; }

    const isLastQueue = activeQ === numQueues - 1;
    const qQuantum = quantums[activeQ] || quantums[quantums.length - 1] || 8;
    const slice = isLastQueue ? p.rbt : qQuantum;

    // Check if a process arrives in a higher queue before completion/slice
    const futureArrivals = procs.filter((x) => x.at > currentTime && x.rbt > 0);
    const nextArrTime = futureArrivals.length > 0 ? Math.min(...futureArrivals.map((x) => x.at)) : Infinity;
    const execTime = Math.min(p.rbt, slice, nextArrTime > currentTime ? nextArrTime - currentTime : slice);

    p.rbt -= execTime;
    currentTime += execTime;
    lastRunningPid = p.pid;

    rawGantt.push({ pid: p.pid, start: startTime, end: currentTime, isIdle: false });
    for (let t = startTime; t < currentTime; t++) {
      const readyPids = queues.flat().map((x) => x.pid);
      tracker.record(t, p.pid, readyPids);
    }

    enqueueArrivals();

    if (p.rbt === 0) {
      const ct = currentTime;
      completed.push({ ...p, ct, tat: ct - p.at, wt: ct - p.at - p.bt, rt: p.rt });
      log.push(`t=${ct}: ${p.pid} completed from Queue ${activeQ} (TAT=${ct - p.at}, WT=${ct - p.at - p.bt})`);
    } else if (execTime === slice && !isLastQueue) {
      const nextLevel = Math.min(activeQ + 1, numQueues - 1);
      p.queueLevel = nextLevel;
      queues[nextLevel].push(p);
      log.push(`t=${currentTime}: ${p.pid} exhausted quantum in Q${activeQ}; demoted to Q${nextLevel}`);
    } else {
      queues[activeQ].push(p);
      log.push(`t=${currentTime}: ${p.pid} preempted; returned to Queue ${activeQ} (rem BT=${p.rbt})`);
    }
  }

  const gantt = mergeGanttBlocks(rawGantt);
  const sortedProcesses = sortProcessesByPid(completed);
  return {
    gantt, processes: sortedProcesses, timeline: finalizeTimeline(tracker.getTimeline(), gantt, completed),
    log, metrics: computeMetrics(sortedProcesses, gantt, options),
  };
}
