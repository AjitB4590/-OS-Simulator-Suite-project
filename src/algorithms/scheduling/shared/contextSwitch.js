/**
 * Shared Context Switch Overhead Helper.
 * Incurs switching latency and inserts visual 'CS' blocks into the Gantt timeline
 * whenever the CPU transitions between two distinct active processes.
 */

/**
 * Checks and records a context switch overhead between two processes.
 *
 * @param {Array<object>} rawGantt - Accumulator array of Gantt blocks
 * @param {string | null} lastPid - PID of the previously executing process
 * @param {string} nextPid - PID of the process about to execute
 * @param {number} currentTime - Current simulation clock tick
 * @param {number} csOverhead - Overhead duration in time units
 * @param {string[]} [log] - Event log array
 * @returns {number} Updated current time tick
 */
export function handleContextSwitch(rawGantt, lastPid, nextPid, currentTime, csOverhead, log = []) {
  if (
    lastPid !== null &&
    lastPid !== nextPid &&
    lastPid !== 'Idle' &&
    lastPid !== 'CS' &&
    csOverhead > 0
  ) {
    const end = currentTime + csOverhead;
    rawGantt.push({
      pid: 'CS',
      start: currentTime,
      end,
      isIdle: true,
      isContextSwitch: true,
    });
    log.push(`t=${currentTime}: Context switch overhead (${lastPid} → ${nextPid}) for ${csOverhead} unit(s)`);
    return end;
  }
  return currentTime;
}
