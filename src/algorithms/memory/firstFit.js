/**
 * First Fit Contiguous Memory Allocation Algorithm.
 *
 * IDEA:
 * Scans memory blocks sequentially from the beginning and allocates the process
 * to the FIRST block that has sufficient capacity (remaining >= process.size).
 * In fixed partition mode, a block cannot host more than one process.
 *
 * TIME COMPLEXITY: O(n * m) where n = processes, m = memory blocks.
 * SPACE COMPLEXITY: O(m) to track partition occupancy.
 */

import { normalizeInputs, computeStats } from './shared.js';

/**
 * Executes First Fit memory allocation simulation.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 * @param {{ mode?: 'dynamic'|'fixed' }} [options]
 */
export function firstFit(blockSizes, processSizes, options = {}) {
  const mode = options?.mode || 'dynamic';
  const { blocks, processes } = normalizeInputs(blockSizes, processSizes);
  const allocations = [];
  const steps = [];

  for (const proc of processes) {
    const candidates = [];
    let chosenIndex = null;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvailableInMode = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      const fits = isAvailableInMode && b.remaining >= proc.size;

      candidates.push({
        index: i,
        remaining: b.remaining,
        fits,
      });

      if (fits && chosenIndex === null) {
        chosenIndex = i;
        break; // First Fit stops at the very first qualifying block
      }
    }

    if (chosenIndex !== null) {
      const targetBlock = blocks[chosenIndex];
      targetBlock.allocatedTo.push({ pid: proc.pid, size: proc.size });
      targetBlock.remaining -= proc.size;
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: chosenIndex });
      steps.push({
        pid: proc.pid,
        size: proc.size,
        chosenBlock: chosenIndex,
        candidates,
        note: `Allocated ${proc.pid} (${proc.size} KB) to Block ${chosenIndex} (${targetBlock.originalSize} KB, remaining: ${targetBlock.remaining} KB).`,
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
