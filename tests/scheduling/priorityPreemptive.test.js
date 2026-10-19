/**
 * Vitest suite for Priority Preemptive algorithm.
 * Validates preemption on higher-priority arrival, textbook datasets, and idle gaps.
 */

import { describe, expect, it } from 'vitest';
import { simulatePriorityPreemptive } from '../../src/algorithms/scheduling/priorityPreemptive.js';

describe('Priority Preemptive Algorithm', () => {
  it('handles idle gaps between processes', () => {
    const processes = [
      { pid: 'P1', at: 2, bt: 3, priority: 2 },
      { pid: 'P2', at: 7, bt: 2, priority: 1 },
    ];
    const result = simulatePriorityPreemptive(processes);

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 2, isIdle: true },
      { pid: 'P1', start: 2, end: 5, isIdle: false },
      { pid: 'Idle', start: 5, end: 7, isIdle: true },
      { pid: 'P2', start: 7, end: 9, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 5, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 9, tat: 2, wt: 0, rt: 0 });
  });

  it('correctly handles preemption when higher priority process arrives', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 4, priority: 3 },
      { pid: 'P2', at: 1, bt: 2, priority: 1 },
      { pid: 'P3', at: 2, bt: 3, priority: 2 },
    ];
    const result = simulatePriorityPreemptive(processes);

    // P1 runs 0..1, P2 preempts at 1 (runs 1..3), P3 runs 3..6, P1 finishes 6..9
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 1, isIdle: false },
      { pid: 'P2', start: 1, end: 3, isIdle: false },
      { pid: 'P3', start: 3, end: 6, isIdle: false },
      { pid: 'P1', start: 6, end: 9, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 9, tat: 9, wt: 5, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 3, tat: 2, wt: 0, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 6, tat: 4, wt: 1, rt: 1 });

    expect(result.metrics.avgTat).toBe(5);
    expect(result.metrics.avgWt).toBe(2);
  });
});
