/**
 * Shared Utilities and Metrics Calculator for Memory Allocation Algorithms.
 * Standardizes input normalization, validation, and fragmentation metrics.
 */

/**
 * Validates memory block and process sizing inputs.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 * @returns {string[]} Validation error messages
 */
export function validateMemoryInputs(blockSizes, processSizes) {
  const errors = [];
  if (!Array.isArray(blockSizes) || blockSizes.length === 0) {
    errors.push('At least one memory block size must be provided.');
  } else {
    blockSizes.forEach((size, idx) => {
      if (!Number.isInteger(size) || size <= 0) {
        errors.push(`Block #${idx + 1} size (${size}) must be a positive integer.`);
      }
    });
  }

  if (!Array.isArray(processSizes) || processSizes.length === 0) {
    errors.push('At least one process size must be provided.');
  } else {
    processSizes.forEach((p, idx) => {
      const size = typeof p === 'object' ? p.size : p;
      if (!Number.isInteger(size) || size <= 0) {
        errors.push(`Process #${idx + 1} size (${size}) must be a positive integer.`);
      }
    });
  }

  return errors;
}

/**
 * Normalizes inputs into standardized structures.
 * @param {number[]} blockSizes
 * @param {Array<number|{ pid: string, size: number }>} processSizes
 */
export function normalizeInputs(blockSizes, processSizes) {
  const blocks = blockSizes.map((size, index) => ({
    index,
    originalSize: size,
    remaining: size,
    allocatedTo: [],
  }));

  const processes = processSizes.map((p, index) => {
    if (typeof p === 'object' && p !== null) {
      return { pid: p.pid || `P${index + 1}`, size: p.size };
    }
    return { pid: `P${index + 1}`, size: p };
  });

  return { blocks, processes };
}

/**
 * Computes memory utilization, internal fragmentation, and external fragmentation.
 * - Dynamic mode: variable partitions that split to exact process size (internal frag = 0).
 * - Fixed mode: 1 process per block (internal frag = block size - process size).
 * - External frag: total free memory when at least 1 process cannot be placed but total free >= min unallocated process size.
 *
 * @param {Array<{ index: number, originalSize: number, remaining: number, allocatedTo: any[] }>} blocks
 * @param {Array<{ pid: string, size: number, blockIndex: number|null }>} allocations
 * @param {'dynamic'|'fixed'} [mode='dynamic']
 */
export function computeStats(blocks, allocations, mode = 'dynamic') {
  const totalMemory = blocks.reduce((sum, b) => sum + b.originalSize, 0);
  const usedMemory = allocations
    .filter((a) => a.blockIndex !== null)
    .reduce((sum, a) => sum + a.size, 0);

  const utilizationPercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
  const unallocatedProcs = allocations.filter((a) => a.blockIndex === null);
  const unallocated = unallocatedProcs.map((a) => a.pid);

  let internalFragmentation = 0;
  if (mode === 'fixed') {
    for (const b of blocks) {
      if (b.allocatedTo.length > 0) {
        const procSize = b.allocatedTo[0].size;
        internalFragmentation += b.originalSize - procSize;
      }
    }
  }

  const totalFreeMemory = blocks.reduce((sum, b) => sum + b.remaining, 0);
  let externalFragmentation = 0;

  if (unallocatedProcs.length > 0) {
    const minUnallocatedSize = Math.min(...unallocatedProcs.map((p) => p.size));
    if (totalFreeMemory >= minUnallocatedSize) {
      externalFragmentation = totalFreeMemory;
    }
  }

  return {
    internalFragmentation,
    externalFragmentation,
    unallocated,
    utilizationPercent,
    totalMemory,
    usedMemory,
  };
}
