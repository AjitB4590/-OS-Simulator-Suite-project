/**
 * Vitest suite for First-Come, First-Served (FCFS) algorithm.
 * Validates single-process execution, idle gap handling, textbook datasets,
 * and contract integrity.
 */

import { describe, expect, it } from 'vitest';
import { simulateFCFS } from '../../src/algorithms/scheduling/fcfs.js';

describe('FCFS Algorithm', () => {
  it('handles a single process correctly', () => {
    const processes = [{ pid: 'P1', at: 0, bt: 5, priority: 1 }];
    const result = simulateFCFS(processes);

    expect(result.gantt).toEqual([{ pid: 'P1', start: 0, end: 5, isIdle: false }]);
    expect(result.processes).toEqual([
      { pid: 'P1', at: 0, bt: 5, priority: 1, ct: 5, tat: 5, wt: 0, rt: 0 },
    ]);
    expect(result.metrics.avgTat).toBe(5);
    expect(result.metrics.avgWt).toBe(0);
    expect(result.metrics.cpuUtilization).toBe(100);
    expect(result.metrics.throughput).toBe(0.2);
    expect(result.metrics.contextSwitches).toBe(0);
  });

  it('correctly inserts an idle gap when arrival times have a gap', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 3, priority: 1 },
      { pid: 'P2', at: 5, bt: 2, priority: 1 },
    ];
    const result = simulateFCFS(processes);

    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 3, isIdle: false },
      { pid: 'Idle', start: 3, end: 5, isIdle: true },
      { pid: 'P2', start: 5, end: 7, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 3, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 7, tat: 2, wt: 0, rt: 0 });
    expect(result.metrics.cpuUtilization).toBe(71.43); // 5 busy / 7 total * 100
    expect(result.metrics.contextSwitches).toBe(1);
  });

  it('computes Galvin textbook dataset (P1=24, P2=3, P3=3 at AT=0)', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 24, priority: 1 },
      { pid: 'P2', at: 0, bt: 3, priority: 1 },
      { pid: 'P3', at: 0, bt: 3, priority: 1 },
    ];
    const result = simulateFCFS(processes);

    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 24, tat: 24, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 27, tat: 27, wt: 24, rt: 24 });
    expect(result.processes[2]).toMatchObject({ pid: 'P3', ct: 30, tat: 30, wt: 27, rt: 27 });
    expect(result.metrics.avgWt).toBe(17);
    expect(result.metrics.avgTat).toBe(27);
    expect(result.metrics.contextSwitches).toBe(2);
  });
});
