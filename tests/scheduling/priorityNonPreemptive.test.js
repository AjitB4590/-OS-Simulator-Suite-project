/**
 * Vitest suite for Priority Non-Preemptive scheduling algorithm.
 * Validates single process, idle gap, tie-breaking, and multi-process dataset.
 */

import { describe, expect, it } from 'vitest';
import { simulatePriorityNonPreemptive } from '../../src/algorithms/scheduling/priorityNonPreemptive.js';

describe('Priority Scheduling (Non-preemptive)', () => {
  it('handles a single process correctly', () => {
    const processes = [{ pid: 'P1', at: 0, bt: 4, priority: 2 }];
    const result = simulatePriorityNonPreemptive(processes);

    expect(result.gantt).toEqual([{ pid: 'P1', start: 0, end: 4, isIdle: false }]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 4, tat: 4, wt: 0, rt: 0 });
    expect(result.metrics.contextSwitches).toBe(0);
  });

  it('correctly handles idle gaps when higher priority process arrives late', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 3, priority: 3 },
      { pid: 'P2', at: 5, bt: 2, priority: 1 },
    ];
    const result = simulatePriorityNonPreemptive(processes);

    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 3, isIdle: false },
      { pid: 'Idle', start: 3, end: 5, isIdle: true },
      { pid: 'P2', start: 5, end: 7, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 3, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 7, tat: 2, wt: 0, rt: 0 });
  });

  it('schedules textbook 5-process dataset (lower number = higher priority)', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 10, priority: 3 },
      { pid: 'P2', at: 1, bt: 1, priority: 1 },
      { pid: 'P3', at: 2, bt: 2, priority: 4 },
      { pid: 'P4', at: 3, bt: 1, priority: 5 },
      { pid: 'P5', at: 4, bt: 5, priority: 2 },
    ];
    const result = simulatePriorityNonPreemptive(processes);

    // P1 runs non-preemptively 0..10. At t=10, P2(pri 1), P5(pri 2), P3(pri 4), P4(pri 5)
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 10, isIdle: false },
      { pid: 'P2', start: 10, end: 11, isIdle: false },
      { pid: 'P5', start: 11, end: 16, isIdle: false },
      { pid: 'P3', start: 16, end: 18, isIdle: false },
      { pid: 'P4', start: 18, end: 19, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 10, tat: 10, wt: 0, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 11, tat: 10, wt: 9, rt: 9 });
    expect(result.processes.find((p) => p.pid === 'P5')).toMatchObject({ ct: 16, tat: 12, wt: 7, rt: 7 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 18, tat: 16, wt: 14, rt: 14 });
    expect(result.processes.find((p) => p.pid === 'P4')).toMatchObject({ ct: 19, tat: 16, wt: 15, rt: 15 });

    expect(result.metrics.avgTat).toBe(12.8);
    expect(result.metrics.avgWt).toBe(9);
    expect(result.metrics.contextSwitches).toBe(4);
  });
});
