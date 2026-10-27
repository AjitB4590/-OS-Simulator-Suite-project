/**
 * First Fit Contiguous Memory Allocation Algorithm.
 *
 * Scans memory blocks sequentially from the beginning and allocates the process
 * to the FIRST block that has sufficient capacity (remaining >= process.size).
 * Generates block-by-block scanning and decision step playback.
 */

import { normalizeInputs, computeStats } from './shared.js';

const cloneBlocks = (blks) => blks.map((b) => ({ ...b, allocatedTo: b.allocatedTo.map((p) => ({ ...p })) }));
const cloneAllocs = (als) => als.map((a) => ({ ...a }));

/**
 * Executes First Fit memory allocation simulation with scan step playback.
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

      candidates.push({ index: i, remaining: b.remaining, fits });

      // Step for examining block i
      steps.push({
        index: steps.length,
        title: `${proc.pid} (${proc.size} KB): Scan Block B${i} (${b.remaining} KB free)`,
        explanation: fits
          ? `Block B${i} has ${b.remaining} KB available (≥ ${proc.size} KB). Fits! (✓) First Fit picks first qualifying block.`
          : `Block B${i} has only ${b.remaining} KB available (< ${proc.size} KB). Too small for ${proc.pid} (✗).`,
        pid: proc.pid,
        size: proc.size,
        chosenBlock: null,
        checkingBlock: i,
        candidates: [...candidates],
        note: fits ? `Block B${i} fits (${b.remaining} KB free).` : `Block B${i} is too small (${b.remaining} KB free).`,
        highlight: { pid: proc.pid, checkingBlock: i, fits, candidateIndex: i },
        snapshot: { blocks: cloneBlocks(blocks), allocations: cloneAllocs(allocations), stats: computeStats(blocks, allocations, mode) },
      });

      if (fits) {
        chosenIndex = i;
        break; // First Fit stops at first qualifying block
      }
    }

    if (chosenIndex !== null) {
      const targetBlock = blocks[chosenIndex];
      targetBlock.allocatedTo.push({ pid: proc.pid, size: proc.size });
      targetBlock.remaining -= proc.size;
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: chosenIndex });

      steps.push({
        index: steps.length,
        title: `Allocate ${proc.pid} ➔ Block B${chosenIndex} (First Fit Decision)`,
        explanation: `First Fit allocated ${proc.pid} (${proc.size} KB) to Block B${chosenIndex} (capacity: ${targetBlock.originalSize} KB, remaining: ${targetBlock.remaining} KB).`,
        pid: proc.pid,
        size: proc.size,
        chosenBlock: chosenIndex,
        candidates: [...candidates],
        note: `Allocated ${proc.pid} (${proc.size} KB) to Block ${chosenIndex} (remaining: ${targetBlock.remaining} KB).`,
        highlight: { pid: proc.pid, chosenBlock: chosenIndex, status: 'allocated' },
        snapshot: { blocks: cloneBlocks(blocks), allocations: cloneAllocs(allocations), stats: computeStats(blocks, allocations, mode) },
      });
    } else {
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: null });
      steps.push({
        index: steps.length,
        title: `No Block Available for ${proc.pid} (${proc.size} KB)`,
        explanation: `All blocks inspected. None have ≥ ${proc.size} KB available. ${proc.pid} is unallocated.`,
        pid: proc.pid,
        size: proc.size,
        chosenBlock: null,
        candidates: [...candidates],
        note: `No block found with ≥ ${proc.size} KB available. ${proc.pid} must wait.`,
        highlight: { pid: proc.pid, chosenBlock: null, status: 'unallocated' },
        snapshot: { blocks: cloneBlocks(blocks), allocations: cloneAllocs(allocations), stats: computeStats(blocks, allocations, mode) },
      });
    }
  }

  const stats = computeStats(blocks, allocations, mode);
  return { allocations, blocks, steps, stats };
}
