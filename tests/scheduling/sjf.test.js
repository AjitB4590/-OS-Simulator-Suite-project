/**
 * Vitest suite for Shortest Job First (SJF) non-preemptive algorithm.
 * Validates single-process, idle gap, tie-breaking, and textbook datasets.
 */

import { describe, expect, it } from 'vitest';
import { simulateSJF } from '../../src/algorithms/scheduling/sjf.js';

describe('SJF Algorithm (Non-preemptive)', () => {
  it('handles a single process starting after t=0', () => {
    const processes = [{ pid: 'P1', at: 2, bt: 4, priority: 1 }];
    const result = simulateSJF(processes);

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 2, isIdle: true },
      { pid: 'P1', start: 2, end: 6, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 6, tat: 4, wt: 0, rt: 0 });
    expect(result.metrics.avgTat).toBe(4);
    expect(result.metrics.avgWt).toBe(0);
  });

  it('handles idle gaps between processes', () => {
    const processes = [
      { pid: 'P1', at: 1, bt: 3, priority: 1 },
      { pid: 'P2', at: 8, bt: 2, priority: 1 },
    ];
    const result = simulateSJF(processes);

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 1, isIdle: true },
      { pid: 'P1', start: 1, end: 4, isIdle: false },
      { pid: 'Idle', start: 4, end: 8, isIdle: true },
      { pid: 'P2', start: 8, end: 10, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 4, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 10, tat: 2, wt: 0, rt: 0 });
  });

  it('correctly schedules textbook 4-process dataset with tie breaking', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 7, priority: 1 },
      { pid: 'P2', at: 2, bt: 4, priority: 1 },
      { pid: 'P3', at: 4, bt: 1, priority: 1 },
      { pid: 'P4', at: 5, bt: 4, priority: 1 },
    ];
    const result = simulateSJF(processes);

    // Execution order: P1 (0..7), P3 (7..8), P2 (8..12, tie broken by earlier AT over P4), P4 (12..16)
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 7, isIdle: false },
      { pid: 'P3', start: 7, end: 8, isIdle: false },
      { pid: 'P2', start: 8, end: 12, isIdle: false },
      { pid: 'P4', start: 12, end: 16, isIdle: false },
    ]);

    // Processes must always be returned sorted by PID number
    expect(result.processes.map((p) => p.pid)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 7, tat: 7, wt: 0, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 12, tat: 10, wt: 6, rt: 6 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 8, tat: 4, wt: 3, rt: 3 });
    expect(result.processes.find((p) => p.pid === 'P4')).toMatchObject({ ct: 16, tat: 11, wt: 7, rt: 7 });

    expect(result.metrics.avgTat).toBe(8);
    expect(result.metrics.avgWt).toBe(4);
  });
});
