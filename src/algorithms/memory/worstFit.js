/**
 * Worst Fit Contiguous Memory Allocation Algorithm.
 *
 * IDEA:
 * Searches all blocks and allocates the process to the LARGEST available block
 * (maximizing leftover hole size so it might remain usable by subsequent processes).
 * Ties are broken by lowest block index.
 *
 * TIME COMPLEXITY: O(n * m) where n = processes, m = memory blocks.
 * SPACE COMPLEXITY: O(m) to track partition occupancy.
 */

import { normalizeInputs, computeStats } from './shared.js';

/**
 * Executes Worst Fit memory allocation simulation.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 * @param {{ mode?: 'dynamic'|'fixed' }} [options]
 */
export function worstFit(blockSizes, processSizes, options = {}) {
  const mode = options?.mode || 'dynamic';
  const { blocks, processes } = normalizeInputs(blockSizes, processSizes);
  const allocations = [];
  const steps = [];

  for (const proc of processes) {
    const candidates = [];
    let worstIndex = null;
    let maxRemaining = -Infinity;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvailableInMode = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      const fits = isAvailableInMode && b.remaining >= proc.size;

      candidates.push({
        index: i,
        remaining: b.remaining,
        fits,
      });

      if (fits && b.remaining > maxRemaining) {
        maxRemaining = b.remaining;
        worstIndex = i;
      }
    }

    if (worstIndex !== null) {
      const targetBlock = blocks[worstIndex];
      targetBlock.allocatedTo.push({ pid: proc.pid, size: proc.size });
      targetBlock.remaining -= proc.size;
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: worstIndex });
      steps.push({
        pid: proc.pid,
        size: proc.size,
        chosenBlock: worstIndex,
        candidates,
        note: `Allocated ${proc.pid} (${proc.size} KB) to Worst-Fit Block ${worstIndex} (${targetBlock.originalSize} KB, remaining: ${targetBlock.remaining} KB).`,
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
