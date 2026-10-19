/**
 * Best Fit Contiguous Memory Allocation Algorithm.
 *
 * IDEA:
 * Searches all blocks and allocates the process to the SMALLEST block that is
 * large enough (remaining >= process.size), minimizing leftover hole size per allocation.
 * Ties are broken by lowest block index.
 *
 * TIME COMPLEXITY: O(n * m) where n = processes, m = memory blocks.
 * SPACE COMPLEXITY: O(m) to track partition occupancy.
 */

import { normalizeInputs, computeStats } from './shared.js';

/**
 * Executes Best Fit memory allocation simulation.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 * @param {{ mode?: 'dynamic'|'fixed' }} [options]
 */
export function bestFit(blockSizes, processSizes, options = {}) {
  const mode = options?.mode || 'dynamic';
  const { blocks, processes } = normalizeInputs(blockSizes, processSizes);
  const allocations = [];
  const steps = [];

  for (const proc of processes) {
    const candidates = [];
    let bestIndex = null;
    let minRemaining = Infinity;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvailableInMode = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      const fits = isAvailableInMode && b.remaining >= proc.size;

      candidates.push({
        index: i,
        remaining: b.remaining,
        fits,
      });

      if (fits && b.remaining < minRemaining) {
        minRemaining = b.remaining;
        bestIndex = i;
      }
    }

    if (bestIndex !== null) {
      const targetBlock = blocks[bestIndex];
      targetBlock.allocatedTo.push({ pid: proc.pid, size: proc.size });
      targetBlock.remaining -= proc.size;
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: bestIndex });
      steps.push({
        pid: proc.pid,
        size: proc.size,
        chosenBlock: bestIndex,
        candidates,
        note: `Allocated ${proc.pid} (${proc.size} KB) to Best-Fit Block ${bestIndex} (${targetBlock.originalSize} KB, remaining: ${targetBlock.remaining} KB).`,
      });
    } else {
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: null });
      steps.push({
        pid: proc.pid,
        size: proc.size,
        chosenBlock: null,
        candidates,
        note: `No block found with ≥ ${proc.size} KB available. ${proc.pid} must wait.`,
      });
    }
  }

  const stats = computeStats(blocks, allocations, mode);
  return { allocations, blocks, steps, stats };
}
