/**
 * Benchmark and Comparison Engine.
 * Executes all registered scheduling algorithms against the exact same process workload
 * and computes ranking metrics to identify the optimal algorithm for given inputs.
 */

import { ALGORITHM_OPTIONS } from '../algorithms/scheduling/index.js';

/**
 * Runs all registered scheduling algorithms across the provided process workload.
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options] - Configuration options (quantum, queues, quantums, contextSwitchOverhead, etc.)
 * @returns {{
 *   comparisons: Array<{ algoId: string, name: string, preemptive: boolean, metrics: object, processes: object[], gantt: object[] }>,
 *   bestAlgorithm: { algoId: string, name: string, metrics: object } | null,
 *   reason: string
 * }}
 */
export function runAllAlgorithms(processes, options = {}) {
  if (!processes || processes.length === 0) {
    return { comparisons: [], bestAlgorithm: null, reason: 'No processes provided for comparison.' };
  }

  const comparisons = ALGORITHM_OPTIONS.map((algo) => {
    const result = algo.simulate(processes, options);
    return {
      algoId: algo.id,
      name: algo.name,
      preemptive: algo.preemptive,
      metrics: result.metrics,
      processes: result.processes,
      gantt: result.gantt,
    };
  });

  // Pick best algorithm: lowest avg WT -> lowest avg RT -> lowest avg TAT
  let best = comparisons[0];
  for (let i = 1; i < comparisons.length; i++) {
    const curr = comparisons[i];
    if (curr.metrics.avgWt < best.metrics.avgWt) {
      best = curr;
    } else if (curr.metrics.avgWt === best.metrics.avgWt) {
      if (curr.metrics.avgRt < best.metrics.avgRt) {
        best = curr;
      } else if (curr.metrics.avgRt === best.metrics.avgRt && curr.metrics.avgTat < best.metrics.avgTat) {
        best = curr;
      }
    }
  }

  const reason = best
    ? `${best.name} delivered the lowest Average Waiting Time (${best.metrics.avgWt.toFixed(2)} units) with ${best.metrics.contextSwitches} context switch(es) and ${best.metrics.cpuUtilization.toFixed(1)}% CPU utilization.`
    : 'No optimal algorithm found.';

  return {
    comparisons,
    bestAlgorithm: best,
    reason,
  };
}
