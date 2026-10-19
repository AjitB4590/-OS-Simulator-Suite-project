/**
 * Vitest suite for Round Robin (RR) preemptive scheduling algorithm.
 * Validates quantum slices, merging of contiguous blocks, arrival interleaving,
 * and idle gap handling.
 */

import { describe, expect, it } from 'vitest';
import { simulateRoundRobin } from '../../src/algorithms/scheduling/roundRobin.js';

describe('Round Robin Algorithm (Preemptive)', () => {
  it('handles a single process by merging adjacent quantum slices into one block', () => {
    const processes = [{ pid: 'P1', at: 0, bt: 5, priority: 1 }];
    const result = simulateRoundRobin(processes, { quantum: 2 });

    // Merged Gantt should show contiguous P1 from 0 to 5
    expect(result.gantt).toEqual([{ pid: 'P1', start: 0, end: 5, isIdle: false }]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 5, tat: 5, wt: 0, rt: 0 });
    expect(result.metrics.contextSwitches).toBe(0);
  });

  it('handles an idle gap before processes arrive', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 2, priority: 1 },
      { pid: 'P2', at: 5, bt: 3, priority: 1 },
    ];
    const result = simulateRoundRobin(processes, { quantum: 2 });

    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 2, isIdle: false },
      { pid: 'Idle', start: 2, end: 5, isIdle: true },
      { pid: 'P2', start: 5, end: 8, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 2, tat: 2, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 8, tat: 3, wt: 0, rt: 0 });
  });

  it('correctly executes Galvin 3-process dataset with TQ=4', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 24, priority: 1 },
      { pid: 'P2', at: 0, bt: 3, priority: 1 },
      { pid: 'P3', at: 0, bt: 3, priority: 1 },
    ];
    const result = simulateRoundRobin(processes, { quantum: 4 });

    // P1 runs 0..4 (rem:20), P2 runs 4..7 (finishes), P3 runs 7..10 (finishes), P1 runs 10..30
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 4, isIdle: false },
      { pid: 'P2', start: 4, end: 7, isIdle: false },
      { pid: 'P3', start: 7, end: 10, isIdle: false },
      { pid: 'P1', start: 10, end: 30, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 30, tat: 30, wt: 6, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 7, tat: 7, wt: 4, rt: 4 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 10, tat: 10, wt: 7, rt: 7 });

    expect(result.metrics.avgTat).toBe(15.67);
    expect(result.metrics.avgWt).toBe(5.67);
    expect(result.metrics.contextSwitches).toBe(3);
  });
});
