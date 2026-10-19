import { describe, it, expect } from 'vitest';
import { bestFit } from '../../src/algorithms/memory/bestFit.js';
import { runAllMemoryAlgorithms } from '../../src/algorithms/memory/index.js';

describe('Best Fit Memory Allocation', () => {
  const textbookBlocks = [100, 500, 200, 300, 600];
  const textbookProcesses = [212, 417, 112, 426];

  it('allocates classic textbook dataset in dynamic partition mode (all fit)', () => {
    const res = bestFit(textbookBlocks, textbookProcesses, { mode: 'dynamic' });

    // P1 (212) -> Block 3 (300, tightest fit)
    // P2 (417) -> Block 1 (500)
    // P3 (112) -> Block 2 (200)
    // P4 (426) -> Block 4 (600)
    expect(res.allocations[0].blockIndex).toBe(3);
    expect(res.allocations[1].blockIndex).toBe(1);
    expect(res.allocations[2].blockIndex).toBe(2);
    expect(res.allocations[3].blockIndex).toBe(4);

    expect(res.stats.unallocated).toHaveLength(0);
    expect(res.stats.usedMemory).toBe(212 + 417 + 112 + 426);
    expect(res.stats.internalFragmentation).toBe(0);
  });

  it('breaks ties using lower block index when blocks have equal remaining space', () => {
    const blocks = [300, 300, 300];
    const proc = [150];
    const res = bestFit(blocks, proc);

    // All 3 blocks have 300 remaining, tie-breaker must pick Block 0
    expect(res.allocations[0].blockIndex).toBe(0);
  });

  it('computes external fragmentation when total free space could satisfy an unallocated process', () => {
    // Blocks: 100, 100 (Total Free = 200). Process: 150.
    // 150 cannot fit in either 100 hole individually, but total free (200) >= 150.
    const res = bestFit([100, 100], [150]);
    expect(res.allocations[0].blockIndex).toBe(null);
    expect(res.stats.externalFragmentation).toBe(200);
  });

  it('allocates in fixed mode and computes internal fragmentation', () => {
    const res = bestFit(textbookBlocks, textbookProcesses, { mode: 'fixed' });
    expect(res.allocations[0].blockIndex).toBe(3);
    expect(res.allocations[1].blockIndex).toBe(1);
    expect(res.allocations[2].blockIndex).toBe(2);
    expect(res.allocations[3].blockIndex).toBe(4);

    const expectedInternalFrag = (300 - 212) + (500 - 417) + (200 - 112) + (600 - 426);
    expect(res.stats.internalFragmentation).toBe(expectedInternalFrag);
  });

  it('supports runAllMemoryAlgorithms with object format process inputs', () => {
    const procs = [{ pid: 'P1', size: 100 }, { pid: 'P2', size: 200 }];
    const all = runAllMemoryAlgorithms([300, 300], procs);
    expect(all).toHaveLength(3);
    expect(all[0].stats.unallocated).toHaveLength(0);
  });
});
