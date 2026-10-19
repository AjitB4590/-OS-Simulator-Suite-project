/**
 * Vitest suite for Comparative Benchmarking Utility.
 * Validates simultaneous execution of all registered algorithms and best algorithm selection.
 */

import { describe, expect, it } from 'vitest';
import { runAllAlgorithms } from '../../src/utils/compare.js';

describe('runAllAlgorithms Benchmark Utility', () => {
  it('executes all 8 registered algorithms on the same input dataset', () => {
    const processes = [
      { pid: 'P1', at: 0, bt: 6, priority: 2 },
      { pid: 'P2', at: 1, bt: 2, priority: 1 },
      { pid: 'P3', at: 2, bt: 4, priority: 3 },
    ];
    const { comparisons, bestAlgorithm, reason } = runAllAlgorithms(processes, { quantum: 2 });

    expect(comparisons).toHaveLength(8);
    expect(bestAlgorithm).toBeDefined();
    expect(bestAlgorithm.algoId).toBeDefined();
    expect(reason).toContain(bestAlgorithm.name);
    expect(reason).toContain('Average Waiting Time');
  });

  it('handles empty process array gracefully', () => {
    const { comparisons, bestAlgorithm, reason } = runAllAlgorithms([]);
    expect(comparisons).toHaveLength(0);
    expect(bestAlgorithm).toBeNull();
    expect(reason).toContain('No processes provided');
  });
});
