/**
 * Vitest suite for discrete timeline generation.
 * Verifies that timeline length strictly matches total execution time
 * and readyQueue only contains arrived, unfinished, non-running processes.
 */

import { describe, expect, it } from 'vitest';
import { ALGORITHM_OPTIONS } from '../../src/algorithms/scheduling/index.js';

describe('Shared Timeline Integrity', () => {
  const processes = [
    { pid: 'P1', at: 0, bt: 5, priority: 2 },
    { pid: 'P2', at: 2, bt: 3, priority: 1 },
    { pid: 'P3', at: 4, bt: 2, priority: 3 },
  ];

  it.each(ALGORITHM_OPTIONS)('ensures $name outputs valid timeline length and valid ready queue', (algo) => {
    const result = algo.simulate(processes, { quantum: 2, queues: 3, quantums: [2, 4, 8] });
    const totalTime = Math.max(...result.gantt.map((b) => b.end), 0);

    // 1. Timeline length must equal total simulation time
    expect(result.timeline.length).toBe(totalTime);

    // 2. Validate every time unit entry
    result.timeline.forEach((entry, t) => {
      expect(entry.time).toBe(t);
      expect(entry.running).toBeDefined();

      // Every PID in readyQueue must have arrived at or before t
      entry.readyQueue.forEach((pid) => {
        const proc = result.processes.find((p) => p.pid === pid);
        expect(proc).toBeDefined();
        expect(proc.at).toBeLessThanOrEqual(t); // Arrived
        expect(proc.ct).toBeGreaterThan(t); // Unfinished
        expect(pid).not.toBe(entry.running); // Not currently running in CPU
      });
    });
  });
});
