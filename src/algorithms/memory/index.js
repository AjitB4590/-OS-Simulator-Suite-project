/**
 * Memory Allocation Algorithm Registry & Educational Metadata.
 * Exposes simulation functions, algorithmic pros/cons, and cross-algorithm benchmarking.
 */

import { firstFit } from './firstFit.js';
import { bestFit } from './bestFit.js';
import { worstFit } from './worstFit.js';

export const MEMORY_ALGORITHMS = [
  {
    id: 'firstFit',
    name: 'First Fit',
    description: 'Allocates the process to the first block with sufficient capacity.',
    pros: ['Fastest search; stops immediately upon finding a viable partition', 'Low algorithmic search overhead'],
    cons: ['Concentrates small fragments at the beginning of memory'],
    bestUseCase: 'High-throughput systems where fast allocation latency outweighs fragmentation minimization.',
    simulate: firstFit,
    fn: firstFit,
  },
  {
    id: 'bestFit',
    name: 'Best Fit',
    description: 'Allocates the process to the smallest block with sufficient capacity.',
    pros: ['Leaves larger memory blocks untouched for future heavy requests', 'Minimizes wasted capacity in fixed mode'],
    cons: ['Requires exhaustive scan of all blocks', 'Creates tiny unusable slivers (external fragmentation)'],
    bestUseCase: 'Memory-constrained embedded systems handling varying process sizes.',
    simulate: bestFit,
    fn: bestFit,
  },
  {
    id: 'worstFit',
    name: 'Worst Fit',
    description: 'Allocates the process to the largest available block.',
    pros: ['Leftover partition holes are large enough to be easily reused by upcoming processes'],
    cons: ['Rapidly degrades large contiguous blocks, starving future large processes', 'Requires full block scan'],
    bestUseCase: 'Environments with predominantly small process sizes where remaining holes remain serviceable.',
    simulate: worstFit,
    fn: worstFit,
  },
];

export const MEMORY_ALGORITHM_MAP = {
  firstFit: MEMORY_ALGORITHMS[0],
  bestFit: MEMORY_ALGORITHMS[1],
  worstFit: MEMORY_ALGORITHMS[2],
};

/**
 * Retrieves algorithm definition by ID.
 * @param {string} id
 */
export function getMemoryAlgorithm(id) {
  return MEMORY_ALGORITHMS.find((a) => a.id === id) || MEMORY_ALGORITHMS[0];
}

/**
 * Runs all 3 memory allocation algorithms on the same input for comparative benchmarking.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 * @param {{ mode?: 'dynamic'|'fixed' }} [options]
 */
export function runAllMemoryAlgorithms(blockSizes, processSizes, options = {}) {
  return MEMORY_ALGORITHMS.map((algo) => {
    const result = algo.simulate(blockSizes, processSizes, options);
    return {
      id: algo.id,
      name: algo.name,
      result,
      stats: result.stats,
    };
  });
}
