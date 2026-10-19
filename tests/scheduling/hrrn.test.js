/**
 * Vitest suite for Highest Response Ratio Next (HRRN) algorithm.
 * Validates starvation mitigation, ratio calculations, textbook datasets, and idle gaps.
 */

import { describe, expect, it } from 'vitest';
import { simulateHRRN } from '../../src/algorithms/scheduling/hrrn.js';

describe('HRRN Algorithm (Non-preemptive)', () => {
  it('correctly handles idle gaps between process arrivals', () => {
    const processes = [
      { pid: 'P1', at: 2, bt: 3, priority: 1 },
      { pid: 'P2', at: 7, bt: 2, priority: 1 },
    ];
    const result = simulateHRRN(processes);

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 2, isIdle: true },
      { pid: 'P1', start: 2, end: 5, isIdle: false },
      { pid: 'Idle', start: 5, end: 7, isIdle: true },
      { pid: 'P2', start: 7, end: 9, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 5, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 9, tat: 2, wt: 0, rt: 0 });
  });

  it('correctly schedules standard 5-process dataset based on response ratio', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 3, priority: 1 },
      { pid: 'P2', at: 2, bt: 6, priority: 1 },
      { pid: 'P3', at: 4, bt: 4, priority: 1 },
      { pid: 'P4', at: 6, bt: 5, priority: 1 },
      { pid: 'P5', at: 8, bt: 2, priority: 1 },
    ];
    const result = simulateHRRN(processes);

    // At t=9, P3 ratio is 2.25 > P4 (1.6) & P5 (1.5). At t=13, P5 ratio is 3.5 > P4 (2.4)
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 3, isIdle: false },
      { pid: 'P2', start: 3, end: 9, isIdle: false },
      { pid: 'P3', start: 9, end: 13, isIdle: false },
      { pid: 'P5', start: 13, end: 15, isIdle: false },
      { pid: 'P4', start: 15, end: 20, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 3, tat: 3, wt: 0, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 9, tat: 7, wt: 1, rt: 1 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 13, tat: 9, wt: 5, rt: 5 });
    expect(result.processes.find((p) => p.pid === 'P4')).toMatchObject({ ct: 20, tat: 14, wt: 9, rt: 9 });
    expect(result.processes.find((p) => p.pid === 'P5')).toMatchObject({ ct: 15, tat: 7, wt: 5, rt: 5 });
  });
});
