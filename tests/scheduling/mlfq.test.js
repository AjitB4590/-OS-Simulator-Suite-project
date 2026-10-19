/**
 * Vitest suite for Multilevel Feedback Queue (MLFQ) algorithm.
 * Validates queue priority hierarchy, quantum demotions, textbook datasets, and idle gaps.
 */

import { describe, expect, it } from 'vitest';
import { simulateMLFQ } from '../../src/algorithms/scheduling/mlfq.js';

describe('MLFQ Algorithm', () => {
  it('correctly handles idle gaps before arrivals', () => {
    const processes = [
      { pid: 'P1', at: 2, bt: 3, priority: 1 },
      { pid: 'P2', at: 7, bt: 2, priority: 1 },
    ];
    const result = simulateMLFQ(processes, { queues: 3, quantums: [2, 4, 8] });

    expect(result.gantt).toEqual([
      { pid: 'Idle', start: 0, end: 2, isIdle: true },
      { pid: 'P1', start: 2, end: 5, isIdle: false },
      { pid: 'Idle', start: 5, end: 7, isIdle: true },
      { pid: 'P2', start: 7, end: 9, isIdle: false },
    ]);
    expect(result.processes[0]).toMatchObject({ pid: 'P1', ct: 5, tat: 3, wt: 0, rt: 0 });
    expect(result.processes[1]).toMatchObject({ pid: 'P2', ct: 9, tat: 2, wt: 0, rt: 0 });
  });

  it('demotes CPU-bound processes across queues while servicing short interactive jobs in top queue', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 5, priority: 1 },
      { pid: 'P2', at: 0, bt: 2, priority: 1 },
    ];
    // Q0 has TQ=2. P1 runs 0..2, demotes to Q1. P2 runs 2..4 in Q0 (finishes). P1 runs 4..7 in Q1 (finishes).
    const result = simulateMLFQ(processes, { queues: 3, quantums: [2, 4, 8] });

    expect(result.gantt).toEqual([
      { pid: 'P1', start: 0, end: 2, isIdle: false },
      { pid: 'P2', start: 2, end: 4, isIdle: false },
      { pid: 'P1', start: 4, end: 7, isIdle: false },
    ]);

    expect(result.processes.find((p) => p.pid === 'P1')).toMatchObject({ ct: 7, tat: 7, wt: 2, rt: 0 });
    expect(result.processes.find((p) => p.pid === 'P2')).toMatchObject({ ct: 4, tat: 4, wt: 2, rt: 2 });
  });
});
