/**
 * Best Fit Contiguous Memory Allocation Algorithm with Step-by-Step Scan Playback.
 *
 * Scans all memory blocks to find the SMALLEST block large enough (remaining >= size),
 * minimizing leftover hole size per allocation. Generates block scan and decision steps.
 */

import { normalizeInputs, computeStats } from './shared.js';

const cloneBlocks = (blks) => blks.map((b) => ({ ...b, allocatedTo: b.allocatedTo.map((p) => ({ ...p })) }));
const cloneAllocs = (als) => als.map((a) => ({ ...a }));

/**
 * Executes Best Fit memory allocation with scan playback.
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

      let isNewBest = false;
      if (fits && b.remaining < minRemaining) {
        minRemaining = b.remaining;
        bestIndex = i;
        isNewBest = true;
      }

      candidates.push({ index: i, remaining: b.remaining, fits, isBest: bestIndex === i });

      steps.push({
        index: steps.length,
        title: `${proc.pid} (${proc.size} KB): Scan Block B${i} (${b.remaining} KB free)`,
        explanation: fits
          ? `Block B${i} fits (${b.remaining} KB ≥ ${proc.size} KB) (✓). ${
              isNewBest
                ? `New best candidate! Smallest qualifying block found so far.`
                : `Current best candidate remains Block B${bestIndex} (${minRemaining} KB free).`
            }`
          : `Block B${i} has only ${b.remaining} KB available (< ${proc.size} KB). Too small (✗).`,
        pid: proc.pid,
        size: proc.size,
        chosenBlock: null,
        checkingBlock: i,
        candidates: [...candidates],
        note: fits ? `Block B${i} fits (${b.remaining} KB free).` : `Block B${i} is too small (${b.remaining} KB free).`,
        highlight: { pid: proc.pid, checkingBlock: i, fits, bestCandidate: bestIndex },
        snapshot: { blocks: cloneBlocks(blocks), allocations: cloneAllocs(allocations), stats: computeStats(blocks, allocations, mode) },
      });
    }

    if (bestIndex !== null) {
      const targetBlock = blocks[bestIndex];
      targetBlock.allocatedTo.push({ pid: proc.pid, size: proc.size });
      targetBlock.remaining -= proc.size;
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: bestIndex });

      steps.push({
        index: steps.length,
        title: `Allocate ${proc.pid} ➔ Block B${bestIndex} (Best Fit Decision)`,
        explanation: `Best Fit: smallest block that fits is Block B${bestIndex} (${targetBlock.originalSize} KB, remaining: ${targetBlock.remaining} KB). Leftover hole minimized to ${targetBlock.remaining} KB.`,
        pid: proc.pid,
        size: proc.size,
        chosenBlock: bestIndex,
        candidates: [...candidates],
        note: `Allocated ${proc.pid} (${proc.size} KB) to Best-Fit Block ${bestIndex} (remaining: ${targetBlock.remaining} KB).`,
        highlight: { pid: proc.pid, chosenBlock: bestIndex, status: 'allocated' },
        snapshot: { blocks: cloneBlocks(blocks), allocations: cloneAllocs(allocations), stats: computeStats(blocks, allocations, mode) },
      });
    } else {
      allocations.push({ pid: proc.pid, size: proc.size, blockIndex: null });
      steps.push({
        index: steps.length,
        title: `No Block Available for ${proc.pid} (${proc.size} KB)`,
        explanation: `All blocks inspected. None have ≥ ${proc.size} KB available. ${proc.pid} must wait.`,
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
