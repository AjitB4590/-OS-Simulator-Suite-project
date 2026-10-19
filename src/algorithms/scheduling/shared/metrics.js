/**
 * Performance metrics calculations for CPU scheduling algorithms.
 * Computes turnaround time, waiting time, response time, CPU utilization,
 * throughput, context switch counts, and starvation warnings.
 */

/**
 * Extracts numeric process ID for consistent numerical sorting.
 * E.g., 'P1' -> 1, 'P10' -> 10.
 *
 * @param {string} pid
 * @returns {number}
 */
export function getPidNumber(pid) {
  const match = String(pid).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Sorts process array deterministically by process ID number.
 *
 * @param {Array<{ pid: string }>} processes
 * @returns {Array<object>}
 */
export function sortProcessesByPid(processes) {
  return [...processes].sort((a, b) => {
    const numA = getPidNumber(a.pid);
    const numB = getPidNumber(b.pid);
    if (numA !== numB) return numA - numB;
    return String(a.pid).localeCompare(String(b.pid));
  });
}

/**
 * Computes aggregate summary metrics for a completed scheduling run.
 *
 * @param {Array<{ pid: string, at: number, bt: number, ct: number, tat: number, wt: number, rt: number }>} processes
 * @param {Array<{ pid: string, start: number, end: number, isIdle?: boolean, isContextSwitch?: boolean }>} gantt
 * @param {{ starvationFactor?: number, minStarvationThreshold?: number }} [options]
 * @returns {{
 *   avgTat: number,
 *   avgWt: number,
 *   avgRt: number,
 *   cpuUtilization: number,
 *   throughput: number,
 *   contextSwitches: number,
 *   starvationWarnings: string[]
 * }}
 */
export function computeMetrics(processes, gantt, options = {}) {
  const n = processes.length;
  if (n === 0) {
    return {
      avgTat: 0,
      avgWt: 0,
      avgRt: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      starvationWarnings: [],
    };
  }

  const totalTat = processes.reduce((acc, p) => acc + (p.tat || 0), 0);
  const totalWt = processes.reduce((acc, p) => acc + (p.wt || 0), 0);
  const totalRt = processes.reduce((acc, p) => acc + (p.rt || 0), 0);

  const totalTime = gantt.length > 0 ? Math.max(...gantt.map((b) => b.end), 0) : 0;

  // CPU utilization counts only actual process execution (Idle and CS overhead are non-busy)
  const busyTime = gantt
    .filter((b) => !b.isIdle && !b.isContextSwitch && b.pid !== 'Idle' && b.pid !== 'IDLE' && b.pid !== 'CS')
    .reduce((acc, b) => acc + (b.end - b.start), 0);

  const avgTat = Number((totalTat / n).toFixed(2));
  const avgWt = Number((totalWt / n).toFixed(2));
  const avgRt = Number((totalRt / n).toFixed(2));
  const cpuUtilization = totalTime > 0 ? Number(((busyTime / totalTime) * 100).toFixed(2)) : 0;
  const throughput = totalTime > 0 ? Number((n / totalTime).toFixed(4)) : 0;

  // Count context switches between different active processes
  let contextSwitches = 0;
  let lastRunningPid = null;

  for (const block of gantt) {
    if (!block.isIdle && !block.isContextSwitch && block.pid !== 'Idle' && block.pid !== 'CS') {
      if (lastRunningPid !== null && lastRunningPid !== block.pid) {
        contextSwitches++;
      }
      lastRunningPid = block.pid;
    }
  }

  // Configurable starvation detection
  const factor = Number(options?.starvationFactor) > 0 ? Number(options.starvationFactor) : 2;
  const minThreshold = Number(options?.minStarvationThreshold) >= 0 ? Number(options.minStarvationThreshold) : 5;
  const starvationWarnings = [];

  for (const p of processes) {
    if (p.wt > factor * avgWt && p.wt >= minThreshold) {
      starvationWarnings.push(
        `Process ${p.pid} experienced potential starvation (WT: ${p.wt} units > ${factor}x avg WT of ${avgWt.toFixed(2)} units).`
      );
    }
  }

  return {
    avgTat,
    avgWt,
    avgRt,
    cpuUtilization,
    throughput,
    contextSwitches,
    starvationWarnings,
  };
}
