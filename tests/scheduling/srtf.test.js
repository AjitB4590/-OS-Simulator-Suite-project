/**
 * Vitest suite for Shortest Remaining Time First (SRTF) algorithm.
 * Tests preemptive shortest job scheduling, textbook datasets, and idle gaps.
 */

import { describe, expect, it } from 'vitest';
import { simulateSRTF } from '../../src/algorithms/scheduling/srtf.js';

describe('SRTF Algorithm (Preemptive SJF)', () => {
  it('correctly handles idle gaps between processes', () => {
    const processes = [
      { pid: 'P1', at: 2, bt: 4, priority: 1 },
      { pid: 'P2', at: 8, bt: 2, priority: 1 },
    ];
    const result = simulateSRTF(processes);

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 2, isIdle: true },
      { pid: 'P1', start: 2, end: 6, isIdle: false },
      { pid: 'Idle', start: 6, end: 8, isIdle: true },
      { pid: 'P2', start: 8, end: 10, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 6, tat: 4, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 10, tat: 2, wt: 0, rt: 0 });
  });

  it('correctly simulates classic Galvin textbook preemption dataset', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 8, priority: 1 },
      { pid: 'P2', at: 1, bt: 4, priority: 1 },
      { pid: 'P3', at: 2, bt: 9, priority: 1 },
      { pid: 'P4', at: 3, bt: 5, priority: 1 },
    ];
    const result = simulateSRTF(processes);

    // Timeline: P1 (0..1), P2 (1..5), P4 (5..10), P1 (10..17), P3 (17..26)
    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 1, isIdle: false },
      { pid: 'P2', start: 1, end: 5, isIdle: false },
      { pid: 'P4', start: 5, end: 10, isIdle: false },
      { pid: 'P1', start: 10, end: 17, isIdle: false },
      { pid: 'P3', start: 17, end: 26, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 17, tat: 17, wt: 9, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 5, tat: 4, wt: 0, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P3')).toMatchObject({ ct: 26, tat: 24, wt: 15, rt: 15 });
    expect(result.processes.find((p) => p.pid === 'P4')).toMatchObject({ ct: 10, tat: 7, wt: 2, rt: 2 });

    expect(result.metrics.avgTat).toBe(13);
    expect(result.metrics.avgWt).toBe(6.5);
  });
});
