/**
 * Input validation helper for CPU scheduling processes and options.
 * Validates non-empty process lists, numeric bounds, non-negative arrival times,
 * positive burst times, unique PIDs, and algorithm configuration settings.
 */

/**
 * Validates an array of process definitions and optional simulation parameters.
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {object} [options] - Optional settings (quantum, contextSwitchOverhead, mlfq config)
 * @returns {string[]} Array of human-readable error messages (empty if valid)
 */
export function validateProcesses(processes, options = {}) {
  const errors = [];

  if (!Array.isArray(processes) || processes.length === 0) {
    errors.push('At least one process is required to run the simulation.');
    return errors;
  }

  const seenPids = new Set();

  processes.forEach((p, index) => {
    const rowLabel = p.pid ? `Process "${p.pid}"` : `Row #${index + 1}`;

    if (!p.pid || String(p.pid).trim() === '') {
      errors.push(`Row #${index + 1} has an empty Process ID.`);
    } else if (seenPids.has(p.pid)) {
      errors.push(`Duplicate Process ID "${p.pid}" detected.`);
    } else {
      seenPids.add(p.pid);
    }

    if (p.at === undefined || p.at === null || isNaN(Number(p.at))) {
      errors.push(`${rowLabel}: Arrival Time must be a valid number.`);
    } else if (Number(p.at) < 0) {
      errors.push(`${rowLabel}: Arrival Time cannot be negative (${p.at}).`);
    }

    if (p.bt === undefined || p.bt === null || isNaN(Number(p.bt))) {
      errors.push(`${rowLabel}: Burst Time must be a valid number.`);
    } else if (Number(p.bt) <= 0) {
      errors.push(`${rowLabel}: Burst Time must be greater than 0 (${p.bt}).`);
    }

    if (p.priority !== undefined && p.priority !== null && p.priority !== '') {
      if (isNaN(Number(p.priority))) {
        errors.push(`${rowLabel}: Priority must be a valid number.`);
      } else if (Number(p.priority) < 1) {
        errors.push(`${rowLabel}: Priority must be 1 or higher (${p.priority}).`);
      }
    }
  });

  if (options) {
    if (options.quantum !== undefined) {
      const q = Number(options.quantum);
      if (isNaN(q) || q <= 0) {
        errors.push(`Time Quantum must be greater than 0 (received ${options.quantum}).`);
      }
    }
    if (options.contextSwitchOverhead !== undefined) {
      const cs = Number(options.contextSwitchOverhead);
      if (isNaN(cs) || cs < 0) {
        errors.push(`Context switch overhead must be 0 or a positive number.`);
      }
    }
    if (options.starvationFactor !== undefined) {
      const sf = Number(options.starvationFactor);
      if (isNaN(sf) || sf <= 0) {
        errors.push(`Starvation factor must be a positive number.`);
      }
    }
  }

  return errors;
}
