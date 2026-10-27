/**
 * Memory Event Simulation Engine: Allocate, Free (Merge Holes), and Compaction.
 *
 * Simulates a chronological sequence of memory management events, computing live
 * internal and external fragmentation at each step.
 */

import { computeStats } from './shared.js';

const cloneBlocks = (blks) => blks.map((b, i) => ({ ...b, index: i, allocatedTo: b.allocatedTo.map((p) => ({ ...p })) }));

function findBlockForAlgo(blocks, size, algo, mode) {
  let chosenIndex = null;
  if (algo === 'firstFit') {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvail = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      if (isAvail && b.remaining >= size) return i;
    }
  } else if (algo === 'bestFit') {
    let minRemaining = Infinity;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvail = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      if (isAvail && b.remaining >= size && b.remaining < minRemaining) {
        minRemaining = b.remaining;
        chosenIndex = i;
      }
    }
  } else if (algo === 'worstFit') {
    let maxRemaining = -Infinity;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isAvail = mode === 'dynamic' ? true : b.allocatedTo.length === 0;
      if (isAvail && b.remaining >= size && b.remaining > maxRemaining) {
        maxRemaining = b.remaining;
        chosenIndex = i;
      }
    }
  }
  return chosenIndex;
}

function mergeAdjacentHoles(blocks) {
  let mergedAny = false;
  let i = 0;
  while (i < blocks.length - 1) {
    if (blocks[i].allocatedTo.length === 0 && blocks[i + 1].allocatedTo.length === 0) {
      blocks[i].originalSize += blocks[i + 1].originalSize;
      blocks[i].remaining += blocks[i + 1].remaining;
      blocks.splice(i + 1, 1);
      mergedAny = true;
    } else {
      i++;
    }
  }
  blocks.forEach((b, idx) => { b.index = idx; });
  return mergedAny;
}

function compactMemory(blocks) {
  const activeProcs = [];
  for (const b of blocks) {
    for (const p of b.allocatedTo) activeProcs.push({ ...p });
  }
  const totalMem = blocks.reduce((s, b) => s + b.originalSize, 0);
  const newBlocks = [];
  let curIndex = 0;
  for (const proc of activeProcs) {
    newBlocks.push({ index: curIndex++, originalSize: proc.size, remaining: 0, allocatedTo: [proc] });
  }
  const usedMem = activeProcs.reduce((s, p) => s + p.size, 0);
  const freeMem = totalMem - usedMem;
  if (freeMem > 0) {
    newBlocks.push({ index: curIndex, originalSize: freeMem, remaining: freeMem, allocatedTo: [] });
  }
  return newBlocks;
}

export function simulateMemoryEvents(initialBlockSizes, events, algo = 'firstFit', options = {}) {
  const mode = options?.mode || 'dynamic';
  let blocks = initialBlockSizes.map((size, index) => ({
    index,
    originalSize: size,
    remaining: size,
    allocatedTo: [],
  }));
  let allocations = [];
  const steps = [];

  steps.push({
    index: 0,
    title: 'Initial Memory State',
    explanation: `Memory initialized with ${blocks.length} block(s). Algorithm: ${algo}.`,
    event: { type: 'init' },
    highlight: {},
    snapshot: { blocks: cloneBlocks(blocks), allocations: [...allocations], stats: computeStats(blocks, allocations, mode) },
  });

  events.forEach((evt, evtIdx) => {
    const stepIdx = steps.length;
    if (evt.type === 'allocate') {
      const chosen = findBlockForAlgo(blocks, evt.size, algo, mode);
      if (chosen !== null) {
        blocks[chosen].allocatedTo.push({ pid: evt.pid, size: evt.size });
        blocks[chosen].remaining -= evt.size;
        allocations = allocations.filter((a) => a.pid !== evt.pid);
        allocations.push({ pid: evt.pid, size: evt.size, blockIndex: chosen });
        const stats = computeStats(blocks, allocations, mode);
        steps.push({
          index: stepIdx,
          title: `Step ${evtIdx + 1}: Allocate ${evt.pid} (${evt.size} KB) ➔ Block B${chosen}`,
          explanation: `${algo.toUpperCase()} chose Block B${chosen} (${blocks[chosen].originalSize} KB, remaining: ${blocks[chosen].remaining} KB). Internal frag: ${stats.internalFragmentation} KB, External frag: ${stats.externalFragmentation} KB.`,
          event: evt,
          highlight: { pid: evt.pid, chosenBlock: chosen, status: 'allocated' },
          snapshot: { blocks: cloneBlocks(blocks), allocations: [...allocations], stats },
        });
      } else {
        allocations = allocations.filter((a) => a.pid !== evt.pid);
        allocations.push({ pid: evt.pid, size: evt.size, blockIndex: null });
        const stats = computeStats(blocks, allocations, mode);
        const isExtFrag = stats.externalFragmentation > 0;
        steps.push({
          index: stepIdx,
          title: `Step ${evtIdx + 1}: Allocation Failed for ${evt.pid} (${evt.size} KB)`,
          explanation: isExtFrag
            ? `EXTERNAL FRAGMENTATION! Total free memory (${stats.totalMemory - stats.usedMemory} KB) ≥ ${evt.size} KB, but no single contiguous block fits. Run Compaction to fix!`
            : `Insufficient total memory to allocate ${evt.pid} (${evt.size} KB).`,
          event: evt,
          highlight: { pid: evt.pid, chosenBlock: null, status: 'failed', isExtFrag },
          snapshot: { blocks: cloneBlocks(blocks), allocations: [...allocations], stats },
        });
      }
    } else if (evt.type === 'free') {
      let freed = false;
      for (const b of blocks) {
        const pIdx = b.allocatedTo.findIndex((p) => p.pid === evt.pid);
        if (pIdx !== -1) {
          const [removed] = b.allocatedTo.splice(pIdx, 1);
          b.remaining += removed.size;
          freed = true;
          break;
        }
      }
      allocations = allocations.filter((a) => a.pid !== evt.pid);
      const merged = mergeAdjacentHoles(blocks);
      const stats = computeStats(blocks, allocations, mode);
      steps.push({
        index: stepIdx,
        title: `Step ${evtIdx + 1}: Free ${evt.pid}${merged ? ' & Merge Adjacent Holes' : ''}`,
        explanation: freed
          ? `Freed ${evt.pid}. Its space returned as an available hole.${merged ? ' Adjacent free holes were coalesced into a larger block!' : ''}`
          : `Process ${evt.pid} was not currently allocated.`,
        event: evt,
        highlight: { pid: evt.pid, freed, merged },
        snapshot: { blocks: cloneBlocks(blocks), allocations: [...allocations], stats },
      });
    } else if (evt.type === 'compact') {
      blocks = compactMemory(blocks);
      allocations = [];
      for (const b of blocks) {
        for (const p of b.allocatedTo) allocations.push({ pid: p.pid, size: p.size, blockIndex: b.index });
      }
      const stats = computeStats(blocks, allocations, mode);
      steps.push({
        index: stepIdx,
        title: `Step ${evtIdx + 1}: Compact Memory (Coalesce Free Space)`,
        explanation: `Compaction complete! All active processes shifted to low memory. All free space coalesced into a single contiguous block of ${blocks[blocks.length - 1]?.remaining || 0} KB. External fragmentation = 0 KB.`,
        event: evt,
        highlight: { compacted: true },
        snapshot: { blocks: cloneBlocks(blocks), allocations: [...allocations], stats },
      });
    }
  });

  return { steps, finalBlocks: blocks, finalAllocations: allocations, stats: computeStats(blocks, allocations, mode) };
}

export const MEMORY_EVENT_PRESETS = {
  extFragCompaction: {
    name: 'External Fragmentation & Compaction',
    description: 'Demonstrates non-adjacent free holes causing allocation failure, and how Compaction resolves it.',
    initialBlocks: [100, 150, 200, 100],
    events: [
      { type: 'allocate', pid: 'P1', size: 100 },
      { type: 'allocate', pid: 'P2', size: 150 },
      { type: 'allocate', pid: 'P3', size: 200 },
      { type: 'allocate', pid: 'P4', size: 100 },
      { type: 'free', pid: 'P1' },
      { type: 'free', pid: 'P3' },
      { type: 'allocate', pid: 'P5', size: 250 },
      { type: 'compact' },
      { type: 'allocate', pid: 'P5', size: 250 },
    ],
  },
  adjacentMerge: {
    name: 'Adjacent Hole Coalescing',
    description: 'Demonstrates automatic coalescing of neighboring free holes when adjacent processes release memory.',
    initialBlocks: [150, 150, 200, 300],
    events: [
      { type: 'allocate', pid: 'P1', size: 150 },
      { type: 'allocate', pid: 'P2', size: 150 },
      { type: 'allocate', pid: 'P3', size: 200 },
      { type: 'free', pid: 'P1' },
      { type: 'free', pid: 'P2' },
      { type: 'allocate', pid: 'P4', size: 280 },
    ],
  },
  classicFitComparison: {
    name: 'Silberschatz Fit Comparison',
    description: 'Classic textbook sequence comparing First, Best, and Worst fit placements.',
    initialBlocks: [100, 500, 200, 300, 600],
    events: [
      { type: 'allocate', pid: 'P1', size: 212 },
      { type: 'allocate', pid: 'P2', size: 417 },
      { type: 'allocate', pid: 'P3', size: 112 },
      { type: 'allocate', pid: 'P4', size: 426 },
    ],
  },
};
